"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { startExam } from "@/lib/actions/exam";

export function StartExamButton({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await startExam(scheduleId);
      if (res.success && res.attemptId) {
        router.push(`/test/${res.attemptId}`);
      } else {
        setErrorMsg(res.message || "Gagal memulai ujian.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5 pt-2">
      {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
      <Button
        onClick={handleStart}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm h-9 shadow-md"
      >
        {loading ? "Menyiapkan Lembar Ujian..." : "Masuk Ruang Ujian →"}
      </Button>
    </div>
  );
}
