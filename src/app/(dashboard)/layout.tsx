import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { logoutUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

async function DashboardNav() {
  let user = null;
  try {
    const { data: session } = await auth.getSession();
    if (session?.user?.email) {
      user = await prisma.user.findFirst({
        where: { email: session.user.email, deletedAt: null },
      });
    }
  } catch (err) {
    console.error("Dashboard layout user fetch error:", err);
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-slate-100">
            Zylthara
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            Institutional Test Integrity Engine
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
          <Link
            href="/dashboard"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/schedules"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Jadwal Ujian
          </Link>
          <Link
            href="/tickets"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Tiket Saya
          </Link>
          {isAdmin && (
            <Link
              href="/admin/schedules"
              className="text-amber-400 hover:text-amber-300 transition-colors font-semibold"
            >
              Kelola Jadwal (Admin)
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
              isAdmin
                ? "bg-amber-950/80 text-amber-300 border-amber-800"
                : "bg-blue-950/80 text-blue-300 border-blue-800"
            }`}
          >
            {user.role}
          </span>
        )}
        <form action={logoutUser}>
          <Button
            variant="outline"
            size="sm"
            type="submit"
            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs h-8"
          >
            Keluar
          </Button>
        </form>
      </div>
    </div>
  );
}

function DashboardNavFallback() {
  return (
    <div className="flex items-center justify-between w-full animate-pulse">
      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-1">
          <div className="h-5 w-24 bg-slate-800 rounded"></div>
          <div className="h-3 w-32 bg-slate-800/60 rounded"></div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="h-4 w-16 bg-slate-800/60 rounded"></div>
          <div className="h-4 w-20 bg-slate-800/60 rounded"></div>
          <div className="h-4 w-16 bg-slate-800/60 rounded"></div>
        </div>
      </div>
      <div className="h-8 w-16 bg-slate-800 rounded"></div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Suspense fallback={<DashboardNavFallback />}>
            <DashboardNav />
          </Suspense>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">
        {children}
      </main>
    </div>
  );
}
