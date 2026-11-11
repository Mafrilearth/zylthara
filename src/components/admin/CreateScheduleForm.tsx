"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSchedule, type ScheduleActionState } from "@/lib/actions/schedule";

const initialState: ScheduleActionState = {
  success: false,
  message: null,
  errors: null,
};

export function CreateScheduleForm() {
  const [state, formAction, isPending] = useActionState(createSchedule, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-slate-100">Buat Jadwal Ujian Baru</CardTitle>
        <CardDescription>
          Tentukan parameter jadwal, lokasi pengujian, dan kuota peserta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.message && (
          <div
            className={`p-3 rounded-md mb-6 text-sm ${
              state.success
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-red-950/60 border border-red-800 text-red-300"
            }`}
          >
            {state.message}
          </div>
        )}

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="date" className="text-sm font-medium text-slate-200">
                Tanggal Ujian
              </label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                className="bg-slate-950/60 border-slate-700 text-slate-100"
              />
              {state.errors?.date && <p className="text-xs text-red-400">{state.errors.date[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="startTime" className="text-sm font-medium text-slate-200">
                Waktu Mulai
              </label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue="09:00"
                required
                className="bg-slate-950/60 border-slate-700 text-slate-100"
              />
              {state.errors?.startTime && (
                <p className="text-xs text-red-400">{state.errors.startTime[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="endTime" className="text-sm font-medium text-slate-200">
                Waktu Selesai
              </label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue="11:00"
                required
                className="bg-slate-950/60 border-slate-700 text-slate-100"
              />
              {state.errors?.endTime && (
                <p className="text-xs text-red-400">{state.errors.endTime[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="location" className="text-sm font-medium text-slate-200">
                Lokasi / Ruang Pengujian
              </label>
              <Input
                id="location"
                name="location"
                placeholder="Contoh: Lab Komputer 1, Gedung C"
                required
                className="bg-slate-950/60 border-slate-700 text-slate-100"
              />
              {state.errors?.location && (
                <p className="text-xs text-red-400">{state.errors.location[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="quota" className="text-sm font-medium text-slate-200">
                Kuota Peserta
              </label>
              <Input
                id="quota"
                name="quota"
                type="number"
                min="1"
                max="500"
                defaultValue="20"
                required
                className="bg-slate-950/60 border-slate-700 text-slate-100"
              />
              {state.errors?.quota && (
                <p className="text-xs text-red-400">{state.errors.quota[0]}</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold px-6"
            >
              {isPending ? "Menyimpan Jadwal..." : "Tambah Jadwal Ujian"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
