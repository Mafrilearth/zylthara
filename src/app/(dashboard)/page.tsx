import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
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
  const isAdmin = candidateRole === "ADMIN";

  return (
    <div className="space-y-6">
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
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  isAdmin
                    ? "bg-amber-950 text-amber-300 border-amber-800"
                    : "bg-blue-950 text-blue-400 border-blue-800"
                }`}
              >
                {candidateRole}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Jadwal Ujian</CardTitle>
            <CardDescription>
              Lihat sesi ujian yang tersedia dan lakukan pemesanan kuota tiket.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/schedules">
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                Buka Jadwal Ujian
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Tiket Ujian Saya</CardTitle>
            <CardDescription>
              Akses kode tiket verifikasi resmi Anda untuk hari pelaksanaan ujian.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tickets">
              <Button variant="outline" className="w-full border-slate-700 text-slate-200 hover:bg-slate-800">
                Lihat Tiket Saya
              </Button>
            </Link>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-amber-900/40 bg-amber-950/10 hover:border-amber-700/60 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg text-amber-300">Admin: Kelola Jadwal</CardTitle>
              <CardDescription className="text-amber-200/60">
                Buat sesi jadwal ujian baru, kelola kuota, dan pantau peserta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/schedules">
                <Button className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold">
                  Kelola Jadwal
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">
          Dashboard Peserta Zylthara
        </h2>
        <p className="text-sm text-slate-400">
          Selamat datang di portal integritas ujian institusional. Sesi Anda aktif dan terlindungi.
        </p>
      </div>

      <Suspense fallback={<CandidateProfileSkeleton />}>
        <CandidateProfile />
      </Suspense>
    </div>
  );
}
