"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { CreateScheduleSchema } from "@/lib/validations/booking";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export type ScheduleActionState = {
  success?: boolean;
  message?: string | null;
  errors?: Record<string, string[]> | null;
};

export async function createSchedule(
  _prevState: ScheduleActionState | null,
  formData: FormData
): Promise<ScheduleActionState> {
  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "Unknown";

  try {
    // SEC-03: RBAC check
    const { user } = await requireRole("ADMIN");

    // SEC-01: Zod validation
    const rawData = {
      date: formData.get("date"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      location: formData.get("location"),
      quota: formData.get("quota"),
    };

    const validation = CreateScheduleSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { date, startTime, endTime, location, quota } = validation.data;

    // Parse DateTime objects
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);
    const scheduleDate = new Date(`${date}T00:00:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return {
        success: false,
        message: "Format tanggal atau waktu tidak valid.",
      };
    }

    if (endDateTime <= startDateTime) {
      return {
        success: false,
        message: "Waktu selesai harus setelah waktu mulai.",
      };
    }

    // Save schedule to DB (SEC-04: UUID + Soft delete)
    const schedule = await prisma.schedule.create({
      data: {
        date: scheduleDate,
        startTime: startDateTime,
        endTime: endDateTime,
        location,
        quota,
      },
    });

    // SEC-05, SEC-06, SEC-07: Audit Logging
    await createAuditLog({
      userId: user.id,
      action: "SCHEDULE_CREATED",
      entity: "Schedule",
      entityId: schedule.id,
      metadata: {
        date,
        startTime,
        endTime,
        location,
        quota,
      },
      ipAddress,
      userAgent,
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/schedules");

    return {
      success: true,
      message: "Jadwal ujian berhasil ditambahkan ke sistem.",
    };
  } catch (err: unknown) {
    console.error("Create schedule error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal membuat jadwal ujian.",
    };
  }
}

export async function getAdminSchedules() {
  try {
    await requireRole("ADMIN");
  } catch {
    return [];
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          bookings: {
            where: {
              status: "CONFIRMED",
              deletedAt: null,
            },
          },
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return schedules.map((s) => ({
    ...s,
    bookedCount: s._count.bookings,
    remainingQuota: Math.max(0, s.quota - s._count.bookings),
  }));
}

