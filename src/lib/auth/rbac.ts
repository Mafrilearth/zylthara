import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export async function requireRole(allowedRoles: Role | Role[]) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.email) {
    throw new Error("Unauthorized: Anda harus login terlebih dahulu.");
  }

  const user = await prisma.user.findFirst({
    where: {
      email: session.user.email,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new Error("Unauthorized: Pengguna tidak ditemukan.");
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden: Anda tidak memiliki hak akses yang diperlukan.");
  }

  return { session, user };
}
