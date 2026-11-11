import Link from "next/link";
import { Suspense } from "react";
import { StartExamButton } from "@/components/booking/StartExamButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyTickets } from "@/lib/actions/booking";

async function TicketsList() {
  const tickets = await getMyTickets();

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 border border-dashed border-slate-800 rounded-xl bg-slate-900/30 space-y-4">
        <div>
          <p className="text-base font-semibold text-slate-200">
            Anda belum memiliki tiket ujian aktif.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Silakan pilih jadwal ujian yang tersedia untuk memesan tiket pengujian Anda.
          </p>
        </div>
        <Link href="/schedules">
          <Button className="bg-blue-600 hover:bg-blue-500 text-white text-sm">
            Lihat Jadwal Ujian
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tickets.map((ticket) => {
        const dateStr = new Date(ticket.schedule.date).toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const startTimeStr = new Date(ticket.schedule.startTime).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const endTimeStr = new Date(ticket.schedule.endTime).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const bookedAtStr = new Date(ticket.createdAt).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Card
            key={ticket.id}
            className="border-blue-900/60 bg-gradient-to-br from-slate-900/90 to-slate-950/80 shadow-2xl relative overflow-hidden"
          >
            {/* Top decorative badge */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Tiket Resmi Ujian
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {ticket.status}
                </span>
              </div>
              <CardTitle className="text-xl text-slate-100 mt-1">{dateStr}</CardTitle>
              <CardDescription className="text-sm font-medium text-blue-400">
                Pukul {startTimeStr} - {endTimeStr} WIB
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-4 text-center space-y-1">
                <span className="text-xs text-slate-400 uppercase tracking-widest block font-medium">
                  Kode Verifikasi Tiket
                </span>
                <span
                  data-testid="ticket-code"
                  className="font-mono text-2xl font-black tracking-widest text-emerald-400 select-all block py-1"
                >
                  {ticket.ticketCode}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Tunjukkan kode ini kepada pengawas saat registrasi kehadiran fisik.
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 pt-1 border-t border-slate-800/60">
                <div className="flex justify-between">
                  <span>Lokasi Ujian:</span>
                  <span className="text-slate-200 font-medium">{ticket.schedule.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Pemesanan:</span>
                  <span className="text-slate-300">{bookedAtStr} WIB</span>
                </div>
              </div>

              {ticket.hasScore && ticket.attemptId ? (
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link href={`/results/${ticket.attemptId}`} className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                      Lihat Hasil & Skor Ujian →
                    </Button>
                  </Link>
                  <a
                    href={`/api/certificate/${ticket.attemptId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-slate-700 text-slate-200 hover:bg-slate-800"
                    >
                      Unduh PDF
                    </Button>
                  </a>
                </div>
              ) : (
                <StartExamButton scheduleId={ticket.schedule.id} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Tiket Ujian Saya</h2>
          <p className="text-sm text-slate-400">
            Daftar tiket resmi untuk sesi pengujian institusi yang telah Anda pesan.
          </p>
        </div>
        <Link href="/schedules">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            + Booking Jadwal Lain
          </Button>
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="py-12 text-center text-slate-500">Memuat daftar tiket Anda...</div>
        }
      >
        <TicketsList />
      </Suspense>
    </div>
  );
}
