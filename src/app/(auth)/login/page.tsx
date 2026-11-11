"use client";

import { useActionState, startTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginUser, type LoginState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState | null, FormData>(
    loginUser,
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors: clientErrors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      formAction(formData);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Zylthara
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Institutional Test Integrity Engine
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/70 shadow-2xl">
          <CardHeader>
            <CardTitle>Masuk ke Akun Peserta</CardTitle>
            <CardDescription>
              Masukkan email dan password terdaftar Anda untuk mengakses ruang ujian.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Alert Pesan Error Server */}
              {state?.message && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/50 bg-red-950/40 p-3 text-sm text-red-300"
                >
                  {state.message}
                </div>
              )}

              {/* Input Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Alamat Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@institusi.ac.id"
                  autoComplete="email"
                  disabled={isPending}
                  {...register("email")}
                  className={
                    clientErrors.email || state?.errors?.email
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {(clientErrors.email?.message || state?.errors?.email?.[0]) && (
                  <p className="text-xs text-red-400">
                    {clientErrors.email?.message || state?.errors?.email?.[0]}
                  </p>
                )}
              </div>

              {/* Input Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password akun Anda"
                  autoComplete="current-password"
                  disabled={isPending}
                  {...register("password")}
                  className={
                    clientErrors.password || state?.errors?.password
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {(clientErrors.password?.message ||
                  state?.errors?.password?.[0]) && (
                  <p className="text-xs text-red-400">
                    {clientErrors.password?.message ||
                      state?.errors?.password?.[0]}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                {isPending ? "Memverifikasi Kredensial..." : "Masuk ke Sistem"}
              </Button>

              <p className="text-center text-xs text-slate-400">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  Daftar di sini
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

