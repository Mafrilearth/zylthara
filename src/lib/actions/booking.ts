"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireRole } from "@/lib/auth/rbac";
import { BookScheduleSchema } from "@/lib/validations/booking";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export type BookingActionResult = {
  success: boolean;
  message?: string;
  ticketCode?: string;
};

function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomStr = "";
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    randomStr += chars[randomBytes[i] % chars.length];
  }
  return `ZYL-${randomStr}`;
}

export async function bookSchedule(scheduleId: string): Promise<BookingActionResult> {
  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "Unknown";

  try {
    // SEC-03: RBAC check (STUDENT or ADMIN allowed to book)
    const { user } = await requireRole(["STUDENT", "ADMIN"]);

    // SEC-01: Zod validation
    const validation = BookScheduleSchema.safeParse({ scheduleId });
    if (!validation.success) {
      return {
        success: false,
        message: "ID Jadwal ujian tidak valid.",
      };
    }

    // Check schedule existence
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        deletedAt: null,
      },
    });

    if (!schedule) {
      return {
        success: false,
        message: "Jadwal ujian tidak ditemukan atau telah dihapus.",
      };
    }

    // Check existing booking for this user
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        scheduleId,
        deletedAt: null,
      },
    });

    if (existingBooking) {
      return {
        success: false,
        message: "Anda sudah memiliki tiket booking untuk jadwal ini.",
      };
    }

    // Check quota with active confirmed bookings
    const confirmedBookingsCount = await prisma.booking.count({
      where: {
        scheduleId,
        status: "CONFIRMED",
        deletedAt: null,
      },
    });

    if (confirmedBookingsCount >= schedule.quota) {
      return {
        success: false,
        message: "Kuota untuk jadwal ini sudah penuh.",
      };
    }

    // Generate unique ticket code
    let ticketCode = generateTicketCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const codeExists = await prisma.booking.findUnique({
        where: { ticketCode },
      });
      if (!codeExists) {
        isUnique = true;
      } else {
        ticketCode = generateTicketCode();
        attempts++;
      }
    }

    // SEC-04: UUID & Soft Delete table insertion
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        scheduleId,
        status: "CONFIRMED",
        ticketCode,
      },
    });

    // SEC-05, SEC-06, SEC-07: Audit Logging
    await createAuditLog({
      userId: user.id,
      action: "BOOKING_CREATED",
      entity: "Booking",
      entityId: booking.id,
      metadata: {
        scheduleId,
        ticketCode,
        location: schedule.location,
        date: schedule.date,
      },
      ipAddress,
      userAgent,
    });

    revalidatePath("/schedules");
    revalidatePath("/tickets");
    revalidatePath("/admin/schedules");

    return {
      success: true,
      message: "Booking tiket berhasil dikonfirmasi.",
      ticketCode: booking.ticketCode,
    };
  } catch (err: unknown) {
    console.error("Booking error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses booking tiket.",
    };
  }
}

export async function getAvailableSchedules() {
  let currentUser = null;
  try {
    const { user } = await requireRole(["STUDENT", "ADMIN"]);
    currentUser = user;
  } catch {
    // If during prerender or not authenticated, continue with currentUser = null
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      bookings: {
        where: {
          deletedAt: null,
          status: "CONFIRMED",
        },
        select: {
          userId: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return schedules.map((s) => {
    const bookedCount = s.bookings.length;
    const remainingQuota = Math.max(0, s.quota - bookedCount);
    const isBookedByMe = currentUser ? s.bookings.some((b) => b.userId === currentUser.id) : false;

    return {
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      quota: s.quota,
      bookedCount,
      remainingQuota,
      isBookedByMe,
    };
  });
}

export async function getMyTickets() {
  let currentUser = null;
  try {
    const { user } = await requireRole(["STUDENT", "ADMIN"]);
    currentUser = user;
  } catch {
    return [];
  }

  if (!currentUser) return [];

  const tickets = await prisma.booking.findMany({
    where: {
      userId: currentUser.id,
      deletedAt: null,
    },
    include: {
      schedule: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const attempts = await prisma.attempt.findMany({
    where: {
      userId: currentUser.id,
      deletedAt: null,
    },
    include: {
      score: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tickets.map((t) => {
    const latestAttempt = attempts.find((a) => a.scheduleId === t.schedule.id);

    return {
      id: t.id,
      ticketCode: t.ticketCode,
      status: t.status,
      createdAt: t.createdAt,
      schedule: {
        id: t.schedule.id,
        date: t.schedule.date,
        startTime: t.schedule.startTime,
        endTime: t.schedule.endTime,
        location: t.schedule.location,
      },
      attemptId: latestAttempt?.id || null,
      attemptStatus: latestAttempt?.status || null,
      hasScore: Boolean(latestAttempt?.score),
    };
  });
}

