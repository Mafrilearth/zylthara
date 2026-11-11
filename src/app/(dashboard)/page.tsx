import { Suspense } from "react";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { logoutUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

async function CandidateProfile() {
  let session = null;
  let user = null;

  try {
    const res = await auth.getSession();
    session = res.data;
    if (session?.user?.email) {
      user = await prisma.user.findFirst({
        where: {
          email: session.user.email,
          deletedAt: null,
        },
      });
    }
  } catch (err) {
    console.error("Session load error:", err);
  }

  const candidateName = user?.name || session?.user?.name || "Peserta Ujian";
  const candidateEmail = user?.email || session?.user?.email || "-";
  const candidateRole = user?.role || "STUDENT";

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
      <CardHeader>
        <CardTitle>Informasi Profil Peserta</CardTitle>
        <CardDescription>
          Data kredensial resmi yang tercatat di sistem Zylthara.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <span className="text-xs text-slate-400 block mb-1">Nama Lengkap</span>
            <span className="text-sm font-semibold text-slate-100">
              {candidateName}
            </span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <span className="text-xs text-slate-400 block mb-1">Alamat Email</span>
            <span className="text-sm font-semibold text-slate-100">
              {candidateEmail}
            </span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <span className="text-xs text-slate-400 block mb-1">Peran Akun</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-400 border border-blue-800">
              {candidateRole}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CandidateProfileSkeleton() {
  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-xl animate-pulse">
      <CardHeader>
        <div className="h-6 w-48 bg-slate-800 rounded mb-2"></div>
        <div className="h-4 w-64 bg-slate-800/60 rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 bg-slate-950/50 border border-slate-800 rounded-lg"></div>
          <div className="h-20 bg-slate-950/50 border border-slate-800 rounded-lg"></div>
          <div className="h-20 bg-slate-950/50 border border-slate-800 rounded-lg"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Zylthara
            </h1>
            <p className="text-xs font-medium text-slate-400">
              Institutional Test Integrity Engine
            </p>
          </div>
          <form action={logoutUser}>
            <Button
              type="submit"
              variant="outline"
              className="border-red-900/60 bg-red-950/20 text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-colors"
            >
              Keluar
            </Button>
          </form>
        </header>

        {/* Dashboard Title & Welcome */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">
            Dashboard Peserta Zylthara
          </h2>
          <p className="text-sm text-slate-400">
            Selamat datang di portal integritas ujian institusional. Sesi Anda aktif dan terlindungi.
          </p>
        </div>

        {/* Candidate Information Card wrapped in Suspense */}
        <Suspense fallback={<CandidateProfileSkeleton />}>
          <CandidateProfile />
        </Suspense>
      </div>
    </div>
  );
}
