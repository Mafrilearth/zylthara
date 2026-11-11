"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookSchedule } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export type ScheduleItem = {
  id: string;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  location: string;
  quota: number;
  bookedCount: number;
  remainingQuota: number;
  isBookedByMe: boolean;
};

export function ScheduleList({ schedules }: { schedules: ScheduleItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleBook(scheduleId: string) {
    setErrorMsg(null);
    setLoadingId(scheduleId);

    try {
      const result = await bookSchedule(scheduleId);
      if (result.success) {
        router.push("/tickets");
        router.refresh();
      } else {
        setErrorMsg(result.message || "Gagal melakukan booking.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat booking.");
    } finally {
      setLoadingId(null);
    }
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
        <p className="text-base font-medium">Belum ada jadwal ujian yang dibuka saat ini.</p>
        <p className="text-xs text-slate-500 mt-1">Silakan hubungi administrator institusi untuk informasi lebih lanjut.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schedules.map((schedule) => {
          const dateStr = new Date(schedule.date).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const startTimeStr = new Date(schedule.startTime).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const endTimeStr = new Date(schedule.endTime).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

          const isFull = schedule.remainingQuota <= 0;
          const isPending = loadingId === schedule.id;

          return (
            <Card
              key={schedule.id}
              className={`border transition-all ${
                schedule.isBookedByMe
                  ? "border-blue-700 bg-blue-950/20"
                  : isFull
                  ? "border-slate-800 bg-slate-900/40 opacity-75"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg text-slate-100">{dateStr}</CardTitle>
                    <CardDescription className="text-sm font-medium text-blue-400 mt-0.5">
                      Pukul {startTimeStr} - {endTimeStr} WIB
                    </CardDescription>
                  </div>
                  {schedule.isBookedByMe ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/80 text-blue-200 border border-blue-600">
                      Terdaftar
                    </span>
                  ) : isFull ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800">
                      Penuh
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                      Tersedia
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Lokasi / Ruang:</span>
                    <span className="font-medium text-slate-200">{schedule.location}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Sisa Kuota:</span>
                    <span className={`font-bold ${isFull ? "text-red-400" : "text-emerald-400"}`}>
                      {schedule.remainingQuota} dari {schedule.quota} kursi
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  {schedule.isBookedByMe ? (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full border-blue-800 text-blue-300 bg-blue-950/40 cursor-not-allowed"
                    >
                      Anda Sudah Terdaftar
                    </Button>
                  ) : isFull ? (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full border-slate-800 text-slate-500 bg-slate-950/50 cursor-not-allowed"
                    >
                      Kuota Penuh
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBook(schedule.id)}
                      disabled={isPending}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md"
                    >
                      {isPending ? "Memproses Booking..." : "Booking Jadwal Ini"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

