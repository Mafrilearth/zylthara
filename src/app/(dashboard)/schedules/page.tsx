import { Suspense } from "react";
import { ScheduleList } from "@/components/booking/ScheduleList";
import { getAvailableSchedules } from "@/lib/actions/booking";

async function SchedulesContainer() {
  const schedules = await getAvailableSchedules();
  return <ScheduleList schedules={schedules} />;
}

export default function SchedulesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Jadwal Ujian Tersedia</h2>
        <p className="text-sm text-slate-400">
          Pilih sesi pengujian yang sesuai dan lakukan booking kuota ujian Anda.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-12 text-center text-slate-500">Memuat daftar sesi ujian...</div>
        }
      >
        <SchedulesContainer />
      </Suspense>
    </div>
  );
}
