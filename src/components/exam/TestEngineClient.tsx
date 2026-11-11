"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveAnswer, submitExam } from "@/lib/actions/exam";

export type ExamQuestion = {
  id: string;
  passageId: string | null;
  section: string;
  text: string;
  options: any;
  order: number;
};

export type ExamPassage = {
  id: string;
  title: string;
  content: string;
  section: string;
};

interface TestEngineClientProps {
  attemptId: string;
  initialRemainingSeconds: number;
  questions: ExamQuestion[];
  passages: ExamPassage[];
  initialAnswers: Record<string, string>;
}

export function TestEngineClient({
  attemptId,
  initialRemainingSeconds,
  questions,
  passages,
  initialAnswers,
}: TestEngineClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [, startTransition] = useTransition();

  const handleAutoSubmit = useCallback(async () => {
    setIsSubmitting(true);
    await submitExam(attemptId);
    setIsSubmitted(true);
  }, [attemptId]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, handleAutoSubmit]);

  async function handleSelectChoice(questionId: string, choice: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }));
    setSaveStatus("saving");

    try {
      const res = await saveAnswer(attemptId, questionId, choice);
      if (res.success) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleConfirmSubmit() {
    setIsSubmitting(true);
    try {
      const res = await submitExam(attemptId);
      if (res.success) {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  }

  const currentQuestion = questions[currentIndex];
  const currentPassage = currentQuestion?.passageId
    ? passages.find((p) => p.id === currentQuestion.passageId)
    : null;

  // Format timer
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${hours > 0 ? `${hours}:` : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const isTimeCritical = remainingSeconds < 300; // < 5 minutes

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-slate-800 bg-slate-900/80 shadow-2xl text-center p-8 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-700 flex items-center justify-center text-emerald-400 text-3xl font-black">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">Ujian Telah Selesai</h2>
            <p className="text-sm text-slate-400">
              Seluruh lembar jawaban Anda telah tersimpan secara resmi di server integritas
              Zylthara.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Button
              onClick={() => {
                startTransition(() => {
                  router.push(`/results/${attemptId}`);
                  router.refresh();
                });
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Lihat Hasil & Skor Ujian →
            </Button>
            <Button
              onClick={() => {
                startTransition(() => {
                  router.push("/tickets");
                  router.refresh();
                });
              }}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Kembali ke Menu Tiket
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-slate-400">
        Tidak ada butir soal dalam sesi ujian ini.
      </div>
    );
  }

  // Parse options from JSON
  const rawOptions = currentQuestion.options;
  let optionsList: Array<{ key: string; text: string }> = [];
  if (Array.isArray(rawOptions)) {
    optionsList = rawOptions.map((opt, i) => ({
      key: String.fromCharCode(65 + i),
      text: typeof opt === "string" ? opt : opt.text || String(opt),
    }));
  } else if (typeof rawOptions === "object" && rawOptions !== null) {
    optionsList = Object.entries(rawOptions).map(([k, v]) => ({
      key: k,
      text: String(v),
    }));
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Top Test Header & Timer */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-100 tracking-tight">
              Zylthara Test Engine
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Bagian: {currentQuestion.section} • Soal {currentIndex + 1} dari {questions.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Save status badge */}
          <span className="text-xs text-slate-400 hidden sm:inline-block">
            {saveStatus === "saving" && "Menyimpan jawaban..."}
            {saveStatus === "saved" && "✓ Jawaban tersimpan"}
            {saveStatus === "error" && "⚠ Gagal menyimpan"}
          </span>

          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-widest ${
              isTimeCritical
                ? "bg-red-950/80 border-red-700 text-red-300 animate-pulse"
                : "bg-slate-900 border-slate-700 text-emerald-400"
            }`}
          >
            <span className="text-xs uppercase font-sans tracking-normal opacity-70">
              Sisa Waktu:
            </span>
            <span>{timeFormatted}</span>
          </div>

          <Button
            onClick={() => setShowConfirmModal(true)}
            size="sm"
            className="bg-red-700 hover:bg-red-600 text-white font-medium text-xs h-8 px-4"
          >
            Submit Ujian
          </Button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center Column: Question Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Passage Card if exists */}
          {currentPassage && (
            <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
              <CardHeader className="py-3 px-5 border-b border-slate-800/80 bg-slate-950/40">
                <CardTitle className="text-sm font-semibold text-slate-200">
                  {currentPassage.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 text-sm text-slate-300 leading-relaxed font-serif whitespace-pre-line max-h-72 overflow-y-auto">
                {currentPassage.content}
              </CardContent>
            </Card>
          )}

          {/* Question Card */}
          <Card className="border-slate-800 bg-slate-900/80 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Nomor {currentIndex + 1}
                </span>
                <span className="text-xs text-slate-500">
                  {answers[currentQuestion.id] ? "Sudah Dijawab" : "Belum Dijawab"}
                </span>
              </div>
              <p className="text-base text-slate-100 font-medium pt-2 leading-relaxed">
                {currentQuestion.text}
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {optionsList.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectChoice(currentQuestion.id, opt.key)}
                    className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-all ${
                      isSelected
                        ? "bg-blue-950/70 border-blue-500 shadow-md ring-1 ring-blue-500"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 text-slate-200"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors shrink-0 ${
                        isSelected
                          ? "bg-blue-600 border-blue-400 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-400"
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-sm font-normal leading-relaxed text-slate-100">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 px-6"
            >
              ← Soal Sebelumnya
            </Button>

            <span className="text-xs text-slate-400">
              Terjawab: <strong className="text-slate-200">{answeredCount}</strong> dari{" "}
              {questions.length} soal
            </span>

            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 font-medium"
              >
                Soal Berikutnya →
              </Button>
            ) : (
              <Button
                onClick={() => setShowConfirmModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 font-medium"
              >
                Selesai & Kumpulkan
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Question Palette Navigation */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
            <CardHeader className="py-3 px-4 border-b border-slate-800/80">
              <CardTitle className="text-sm font-semibold text-slate-200">
                Navigasi Butir Soal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = Boolean(answers[q.id]);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 w-9 rounded-lg font-mono text-xs font-bold transition-all border flex items-center justify-center ${
                        isCurrent
                          ? "ring-2 ring-blue-400 border-white bg-blue-600 text-white shadow-lg"
                          : isAnswered
                            ? "bg-emerald-950/80 border-emerald-600 text-emerald-300 hover:bg-emerald-900"
                            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-950 border border-emerald-600"></div>
                  <span>Sudah Dijawab ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-800"></div>
                  <span>Belum Dijawab ({questions.length - answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-blue-600 border border-white"></div>
                  <span>Posisi Aktif</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">Kumpulkan Lembar Ujian?</h3>
              <p className="text-sm text-slate-300">
                Anda telah menjawab <strong className="text-emerald-400">{answeredCount}</strong>{" "}
                dari <strong>{questions.length}</strong> butir soal. Sesi ujian akan ditutup secara
                permanen setelah dikumpulkan.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Lanjutkan Mengerjakan
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5"
              >
                {isSubmitting ? "Mengumpulkan..." : "Ya, Kumpulkan Sekarang"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
