import { Suspense } from "react";
import { CreateScheduleForm } from "@/components/admin/CreateScheduleForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSchedules } from "@/lib/actions/schedule";

async function SchedulesTable() {
  const schedules = await getAdminSchedules();

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 border border-dashed border-slate-800 rounded-lg">
        Belum ada jadwal ujian yang dibuat. Silakan tambahkan jadwal baru menggunakan form di atas.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-950/80 text-slate-400 uppercase text-xs border-b border-slate-800">
          <tr>
            <th className="py-3 px-4">Tanggal Ujian</th>
            <th className="py-3 px-4">Waktu</th>
            <th className="py-3 px-4">Lokasi</th>
            <th className="py-3 px-4 text-center">Kuota Total</th>
            <th className="py-3 px-4 text-center">Terisi</th>
            <th className="py-3 px-4 text-center">Sisa Kuota</th>
            <th className="py-3 px-4 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {schedules.map((schedule) => {
            const dateStr = new Date(schedule.date).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "short",
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

            return (
              <tr key={schedule.id} className="hover:bg-slate-900/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-100">{dateStr}</td>
                <td className="py-3.5 px-4 text-slate-300">
                  {startTimeStr} - {endTimeStr} WIB
                </td>
                <td className="py-3.5 px-4 text-slate-300">{schedule.location}</td>
                <td className="py-3.5 px-4 text-center font-semibold text-slate-200">
                  {schedule.quota}
                </td>
                <td className="py-3.5 px-4 text-center text-blue-400 font-medium">
                  {schedule.bookedCount}
                </td>
                <td className="py-3.5 px-4 text-center font-bold">
                  <span className={isFull ? "text-red-400" : "text-emerald-400"}>
                    {schedule.remainingQuota}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      isFull
                        ? "bg-red-950/80 text-red-300 border-red-800"
                        : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                    }`}
                  >
                    {isFull ? "Penuh" : "Tersedia"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminSchedulesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">
          Kelola Jadwal Ujian (Admin)
        </h2>
        <p className="text-sm text-slate-400">
          Buat sesi pengujian institusi baru, alokasikan kuota ruang, dan pantau status keterisian.
        </p>
      </div>

      <CreateScheduleForm />

      <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-slate-100">Daftar Jadwal Ujian Terjadwal</CardTitle>
          <CardDescription>
            Seluruh sesi pengujian aktif yang terdaftar di basis data Zylthara.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<div className="py-8 text-center text-slate-500">Memuat data jadwal...</div>}
          >
            <SchedulesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
