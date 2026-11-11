import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

interface VerifyPageProps {
  params: Promise<{ code: string }>;
}

async function VerifyContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { verificationCode: code },
    include: {
      attempt: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
          score: true,
          schedule: {
            select: {
              location: true,
              date: true,
            },
          },
        },
      },
    },
  });

  if (!certificate?.attempt.score) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <Card className="max-w-lg w-full border-rose-900/60 bg-slate-900/90 shadow-2xl p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-950 border border-rose-600 flex items-center justify-center text-rose-400 text-3xl font-black">
            ✕
          </div>
          <div className="space-y-2">
            <span className="inline-block text-xs uppercase tracking-widest font-bold px-3 py-1 bg-rose-950/80 text-rose-400 border border-rose-800 rounded-full">
              Verifikasi Gagal
            </span>
            <h1 className="text-2xl font-bold text-slate-100">Sertifikat Tidak Ditemukan</h1>
            <p className="text-sm text-slate-400">
              Kode verifikasi <span className="font-mono text-rose-300 font-semibold">{code}</span>{" "}
              tidak terdaftar dalam basis data integritas pengujian Zylthara.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 text-left space-y-1">
            <p className="font-semibold text-slate-300">Kemungkinan penyebab:</p>
            <p>• Kode verifikasi salah ketik atau URL tidak lengkap.</p>
            <p>• Sertifikat telah dicabut atau belum diterbitkan secara resmi.</p>
          </div>
          <div className="pt-2">
            <Link href="/">
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { attempt } = certificate;
  const score = attempt.score;
  const user = attempt.user;
  const schedule = attempt.schedule;

  if (!score) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <Card className="max-w-lg w-full border-rose-900/60 bg-slate-900/90 shadow-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-slate-100">Skor Ujian Belum Diterbitkan</h1>
          <p className="text-sm text-slate-400">
            Sertifikat ini belum memiliki lembar skor terkonfirmasi.
          </p>
        </Card>
      </div>
    );
  }

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(certificate.issuedAt));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Institutional Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sertifikat Terverifikasi Asli & Sah
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Portal Verifikasi Publik Zylthara
          </h1>
          <p className="text-sm text-slate-400">
            Sistem Verifikasi Kredensial dan Integritas Hasil Ujian Institusional
          </p>
        </div>

        {/* Certificate Card */}
        <Card className="border-slate-800 bg-slate-900/80 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-5">
            <p className="text-xs uppercase font-medium text-slate-400 tracking-wider">
              Nama Peserta Ujian
            </p>
            <h2 className="text-2xl font-bold text-slate-100 mt-1">{user.name}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium">Nomor Sertifikat</p>
              <p className="font-mono text-sm font-semibold text-slate-200 mt-1">
                {certificate.certificateNo}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium">Kode Verifikasi</p>
              <p className="font-mono text-sm font-semibold text-emerald-400 mt-1">
                {certificate.verificationCode}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium">Tanggal Diterbitkan</p>
              <p className="text-sm font-medium text-slate-200 mt-1">{formattedDate}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium">Lokasi / Pusat Ujian</p>
              <p className="text-sm font-medium text-slate-200 mt-1">{schedule.location}</p>
            </div>
          </div>

          {/* Scaled Score Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Total Skor ITP
                </p>
                <p className="text-xs text-slate-500">Skala Standar TOEFL ITP (310 - 677)</p>
              </div>
              <div className="text-3xl font-black text-cyan-400">{score.totalScore}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <p className="text-[11px] text-slate-400">Listening</p>
                <p className="text-base font-bold text-slate-100 mt-0.5">{score.listeningScore}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <p className="text-[11px] text-slate-400">Structure</p>
                <p className="text-base font-bold text-slate-100 mt-0.5">{score.structureScore}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <p className="text-[11px] text-slate-400">Reading</p>
                <p className="text-base font-bold text-slate-100 mt-0.5">{score.readingScore}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`/api/certificate/${attempt.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium">
                Unduh Salinan PDF Resmi
              </Button>
            </a>
            <Link href="/" className="sm:w-auto">
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Beranda
              </Button>
            </Link>
          </div>
        </Card>

        {/* Cryptographic Ledger Assurance Footer */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>
            Kredensial ini diverifikasi secara kriptografis menggunakan audit trail Zylthara Engine.
          </p>
          <p>
            © {new Date().getFullYear()} Zylthara Institutional Test Integrity. Seluruh hak cipta
            dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage(props: VerifyPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Memverifikasi keaslian sertifikat...
        </div>
      }
    >
      <VerifyContent params={props.params} />
    </Suspense>
  );
}
