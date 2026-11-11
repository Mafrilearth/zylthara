import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getExamResult } from "@/lib/actions/exam";

interface ResultsPageProps {
  params: Promise<{ attemptId: string }>;
}

async function ResultsContent({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const result = await getExamResult(attemptId);

  if (!result.success || !result.attempt) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <Card className="p-8 border-slate-800 bg-slate-900/80 space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Hasil Belum Tersedia</h2>
          <p className="text-sm text-slate-400">
            {result.message || "Sesi ujian ini belum dinilai atau tidak ditemukan."}
          </p>
          <div className="pt-2">
            <Link href="/tickets">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                Kembali ke Tiket Saya
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { attempt } = result;
  const { score, certificate, user, schedule } = attempt;

  const formattedDate = attempt.finishedAt
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(attempt.finishedAt))
    : "-";

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Ujian Telah Dinilai Resmi
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100">Laporan Hasil Pengujian</h1>
          <p className="text-sm text-slate-400 mt-1">
            Skor terstandardisasi ITP dan sertifikat digital telah diterbitkan oleh Zylthara Engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {certificate ? (
            <a href={`/api/certificate/${attempt.id}`} target="_blank" rel="noopener noreferrer">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30">
                Unduh Sertifikat PDF ↓
              </Button>
            </a>
          ) : null}
          <Link href="/tickets">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Tiket Saya
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Total Score Banner */}
      <Card className="border-cyan-900/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">
              Total Scaled Score
            </span>
            <div className="text-6xl font-black text-white tracking-tight">
              {score ? score.totalScore : 0}
              <span className="text-xl font-normal text-slate-500 ml-2">/ 677</span>
            </div>
            <p className="text-xs text-slate-400">
              Dikonversi menggunakan algoritma standar TOEFL ITP (Skala 310 – 677).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto text-sm">
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-500 text-xs block">Nama Peserta</span>
              <span className="font-semibold text-slate-200">{user.name}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-500 text-xs block">Waktu Selesai</span>
              <span className="font-semibold text-slate-200">{formattedDate} WIB</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-500 text-xs block">Lokasi Ujian</span>
              <span className="font-semibold text-slate-200">{schedule.location}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-500 text-xs block">Butir Terjawab</span>
              <span className="font-semibold text-slate-200">
                {attempt.totalAnswered} dari {attempt.totalQuestions} Soal
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Section Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Listening */}
        <Card className="border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bagian 1
            </span>
            <span className="text-xs font-mono text-cyan-400">Skala 31 - 68</span>
          </div>
          <h3 className="text-base font-bold text-slate-200">Listening Comprehension</h3>
          <div className="text-4xl font-extrabold text-white">
            {score ? score.listeningScore : 31}
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, (((score?.listeningScore || 31) - 31) / (68 - 31)) * 100))}%`,
              }}
            />
          </div>
        </Card>

        {/* Structure */}
        <Card className="border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bagian 2
            </span>
            <span className="text-xs font-mono text-emerald-400">Skala 31 - 68</span>
          </div>
          <h3 className="text-base font-bold text-slate-200">Structure & Written Expression</h3>
          <div className="text-4xl font-extrabold text-white">
            {score ? score.structureScore : 31}
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, (((score?.structureScore || 31) - 31) / (68 - 31)) * 100))}%`,
              }}
            />
          </div>
        </Card>

        {/* Reading */}
        <Card className="border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bagian 3
            </span>
            <span className="text-xs font-mono text-purple-400">Skala 31 - 67</span>
          </div>
          <h3 className="text-base font-bold text-slate-200">Reading Comprehension</h3>
          <div className="text-4xl font-extrabold text-white">
            {score ? score.readingScore : 31}
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, (((score?.readingScore || 31) - 31) / (67 - 31)) * 100))}%`,
              }}
            />
          </div>
        </Card>
      </div>

      {/* Certificate & Public Verification Box */}
      {certificate ? (
        <Card className="border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Kredensial Sertifikat Resmi</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sertifikat ini dijamin keasliannya dan dapat diverifikasi publik tanpa login.
              </p>
            </div>
            <a href={`/api/certificate/${attempt.id}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-medium">
                Unduh PDF Resmi (Watermark SPECIMEN)
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-xs text-slate-500 block">Nomor Sertifikat Resmi</span>
              <span className="font-mono text-sm font-bold text-slate-200 mt-1 block">
                {certificate.certificateNo}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-xs text-slate-500 block">Kode Verifikasi Publik</span>
              <span className="font-mono text-sm font-bold text-emerald-400 mt-1 block">
                {certificate.verificationCode}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-slate-400">
              Tautan Verifikasi Langsung:{" "}
              <Link
                href={`/verify/${certificate.verificationCode}`}
                className="text-cyan-400 hover:underline font-mono"
                target="_blank"
              >
                /verify/{certificate.verificationCode}
              </Link>
            </div>
            <Link href={`/verify/${certificate.verificationCode}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Uji Halaman Verifikasi Publik ↗
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export default function ResultsPage(props: ResultsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-12 text-center text-slate-400">
          Memuat lembar hasil ujian...
        </div>
      }
    >
      <ResultsContent params={props.params} />
    </Suspense>
  );
}
