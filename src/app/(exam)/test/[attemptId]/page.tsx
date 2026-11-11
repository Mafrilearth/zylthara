import { Suspense } from "react";
import { getExamSession } from "@/lib/actions/exam";
import { TestEngineClient } from "@/components/exam/TestEngineClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

async function ExamSessionContent({
  attemptIdPromise,
}: {
  attemptIdPromise: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await attemptIdPromise;
  const session = await getExamSession(attemptId);

  if (session.isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <Card className="max-w-md w-full border-slate-800 bg-slate-900/80 shadow-2xl text-center p-8 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-2xl font-bold">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">Sesi Ujian Selesai</h2>
            <p className="text-sm text-slate-400">
              Sesi ujian ini telah berstatus{" "}
              <strong className="text-amber-400">{session.status}</strong> dan tidak lagi menerima perubahan jawaban.
            </p>
          </div>
          <Link href="/tickets">
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium">
              Kembali ke Menu Tiket
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <TestEngineClient
      attemptId={session.attemptId || attemptId}
      initialRemainingSeconds={session.remainingSeconds || 3600}
      questions={session.questions || []}
      passages={session.passages || []}
      initialAnswers={session.answers || {}}
    />
  );
}

function ExamLoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 animate-pulse">
      <header className="border-b border-slate-800 bg-slate-900/90 h-16 px-6 flex items-center justify-between">
        <div className="h-5 w-48 bg-slate-800 rounded"></div>
        <div className="h-8 w-32 bg-slate-800 rounded"></div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-xl"></div>
          <div className="h-12 bg-slate-900/40 rounded-lg"></div>
        </div>
        <div className="lg:col-span-1">
          <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-xl"></div>
        </div>
      </main>
    </div>
  );
}

export default function ExamTestPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  return (
    <Suspense fallback={<ExamLoadingSkeleton />}>
      <ExamSessionContent attemptIdPromise={params} />
    </Suspense>
  );
}
