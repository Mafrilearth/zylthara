"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { RegisterSchema, LoginSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth/server";

export type RegisterState = {
  success?: boolean;
  message?: string | null;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  } | null;
};

export type LoginState = {
  success?: boolean;
  message?: string | null;
  errors?: {
    email?: string[];
    password?: string[];
  } | null;
};

/**
 * Server Action for candidate registration (F-01, AC-02, AC-03, AC-04, AC-08, SEC-01..SEC-10)
 */
export async function registerUser(
  _prevState: RegisterState | null,
  formData: FormData
): Promise<RegisterState> {
  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "Unknown";

  // Langkah 1: Parse data dengan RegisterSchema.safeParse() (SEC-01)
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = RegisterSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validation.data;

  // Cek duplikasi email (AC-03)
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  });

  if (existingUser) {
    return {
      success: false,
      errors: {
        email: ["Email sudah terdaftar"],
      },
    };
  }

  try {
    // Langkah 2: Daftarkan user ke Neon Managed Better Auth (SEC-09)
    const { data: authData, error: authError } = await auth.signUp.email({
      email,
      password,
      name,
    });

    if (authError) {
      return {
        success: false,
        message: authError.message || "Gagal mendaftarkan akun di penyedia autentikasi",
      };
    }

    const authUserId = authData?.user?.id;

    // Langkah 3: Simpan data user ke tabel User via Prisma (SEC-04, SEC-09, SEC-10)
    const newUser = await prisma.user.create({
      data: {
        ...(authUserId ? { id: authUserId } : {}),
        name,
        email,
        passwordHash: "MANAGED_BY_NEON_AUTH", // Delegated to Neon Auth (SEC-09)
      },
    });

    // Langkah 4: Tulis entri ke tabel AuditLog dengan action USER_REGISTERED (SEC-05, SEC-06, SEC-07, AC-08)
    await createAuditLog({
      userId: newUser.id,
      action: "USER_REGISTERED",
      entity: "User",
      entityId: newUser.id,
      metadata: {
        name,
        email,
      },
      ipAddress,
      userAgent,
    });
  } catch (err: unknown) {
    console.error("Registration error:", err);
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses registrasi.",
    };
  }

  // Redirect ke halaman login setelah registrasi berhasil
  redirect("/login");
}

/**
 * Server Action for candidate login (F-02, AC-05, AC-08, SEC-01..SEC-10)
 */
export async function loginUser(
  _prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "Unknown";

  // Langkah 1: Parse data dengan LoginSchema.safeParse() (SEC-01)
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = LoginSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;

  try {
    // Langkah 2: Panggil Neon Managed Better Auth untuk sign-in
    const { data: authData, error: authError } = await auth.signIn.email({
      email,
      password,
    });

    if (authError || !authData) {
      console.error("Neon Auth sign-in failed:", authError);
      return {
        success: false,
        message: authError?.message || "Email atau password salah",
      };
    }

    // Ambil data user dari tabel User
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    const targetUserId = user?.id || authData?.user?.id;

    // Langkah 3: Tulis entri ke tabel AuditLog dengan action USER_LOGIN (SEC-05, SEC-06, SEC-07, AC-08)
    if (targetUserId) {
      await createAuditLog({
        userId: targetUserId,
        action: "USER_LOGIN",
        entity: "User",
        entityId: targetUserId,
        metadata: {
          email,
        },
        ipAddress,
        userAgent,
      });
    }
  } catch (err: unknown) {
    console.error("Login unexpected error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses login.",
    };
  }

  // Redirect ke /dashboard jika login sukses (AC-05)
  redirect("/dashboard");
}

/**
 * Server Action for candidate logout (F-03, AC-06, SEC-05, SEC-06)
 */
export async function logoutUser(): Promise<void> {
  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "Unknown";

  try {
    const { data: session } = await auth.getSession();
    if (session?.user?.id) {
      await createAuditLog({
        userId: session.user.id,
        action: "USER_LOGOUT",
        entity: "User",
        entityId: session.user.id,
        metadata: {
          email: session.user.email,
        },
        ipAddress,
        userAgent,
      });
    }
  } catch (err) {
    console.error("Logout audit error:", err);
  }

  await auth.signOut();
  redirect("/login");
}
