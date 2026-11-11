"use server";

import { headers } from "next/headers";
import { requireRole } from "@/lib/auth/rbac";
import {
  StartExamSchema,
  SaveAnswerSchema,
  SubmitExamSchema,
} from "@/lib/validations/exam";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import {
  startAttemptTimer,
  checkAttemptTime,
  clearAttemptTimer,
} from "@/lib/redis";

export async function startExam(scheduleId: string) {
  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "Unknown";

  try {
    const { user } = await requireRole(["STUDENT", "ADMIN"]);

    const validation = StartExamSchema.safeParse({ scheduleId });
    if (!validation.success) {
      return { success: false, message: "ID Jadwal tidak valid." };
    }

    // Verify confirmed booking
    const booking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        scheduleId,
        status: "CONFIRMED",
        deletedAt: null,
      },
    });

    if (!booking) {
      return {
        success: false,
        message: "Anda belum memiliki tiket booking terkonfirmasi untuk jadwal ini.",
      };
    }

    // Check if an existing attempt is in progress
    let attempt = await prisma.attempt.findFirst({
      where: {
        userId: user.id,
        scheduleId,
        status: "IN_PROGRESS",
        deletedAt: null,
      },
    });

    if (!attempt) {
      attempt = await prisma.attempt.create({
        data: {
          userId: user.id,
          scheduleId,
          status: "IN_PROGRESS",
        },
      });

      // Start Redis timer authority (60 minutes)
      await startAttemptTimer(attempt.id, 60);

      // SEC-05, SEC-06: Audit Logging
      await createAuditLog({
        userId: user.id,
        action: "EXAM_STARTED",
        entity: "Attempt",
        entityId: attempt.id,
        metadata: {
          scheduleId,
          ticketCode: booking.ticketCode,
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      attemptId: attempt.id,
    };
  } catch (err: unknown) {
    console.error("Start exam error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memulai sesi ujian.",
    };
  }
}

export async function getExamSession(attemptId: string) {
  let currentUser = null;
  try {
    const { user } = await requireRole(["STUDENT", "ADMIN"]);
    currentUser = user;
  } catch {
    return {
      isFinished: false,
      isPrerender: true,
      attemptId,
      questions: [],
      passages: [],
      answers: {},
      remainingSeconds: 3600,
    };
  }

  const attempt = await prisma.attempt.findFirst({
    where: {
      id: attemptId,
      userId: currentUser.id,
      deletedAt: null,
    },
    include: {
      schedule: true,
    },
  });

  if (!attempt) {
    throw new Error("Sesi ujian tidak ditemukan.");
  }

  if (attempt.status !== "IN_PROGRESS") {
    return {
      isFinished: true,
      status: attempt.status,
      schedule: attempt.schedule,
    };
  }

  // Check Redis timer
  const timer = await checkAttemptTime(attemptId);
  if (!timer.isValid) {
    // Auto-expire attempt
    await prisma.attempt.update({
      where: { id: attemptId },
      data: { status: "EXPIRED", finishedAt: new Date() },
    });
    return {
      isFinished: true,
      status: "EXPIRED",
      schedule: attempt.schedule,
    };
  }

  // SEC-02: DO NOT EXPOSE answerKey.
  // Explicitly query only candidate-facing fields.
  const questions = await prisma.question.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      passageId: true,
      section: true,
      text: true,
      options: true,
      order: true,
    },
    orderBy: {
      order: "asc",
    },
  });

  const passages = await prisma.passage.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      content: true,
      section: true,
    },
  });

  const existingAnswers = await prisma.answer.findMany({
    where: {
      attemptId,
      deletedAt: null,
    },
    select: {
      questionId: true,
      choice: true,
    },
  });

  const answersMap: Record<string, string> = {};
  for (const ans of existingAnswers) {
    answersMap[ans.questionId] = ans.choice;
  }

  return {
    isFinished: false,
    status: attempt.status,
    attemptId: attempt.id,
    schedule: {
      location: attempt.schedule.location,
      date: attempt.schedule.date,
    },
    questions,
    passages,
    answers: answersMap,
    remainingSeconds: timer.remainingSeconds,
  };
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  choice: string
) {
  try {
    const { user } = await requireRole(["STUDENT", "ADMIN"]);

    const validation = SaveAnswerSchema.safeParse({ attemptId, questionId, choice });
    if (!validation.success) {
      return { success: false, message: "Data jawaban tidak valid." };
    }

    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        userId: user.id,
        status: "IN_PROGRESS",
        deletedAt: null,
      },
    });

    if (!attempt) {
      return { success: false, message: "Sesi ujian tidak aktif atau tidak ditemukan." };
    }

    // Verify timer in Redis
    const timer = await checkAttemptTime(attemptId);
    if (!timer.isValid) {
      await prisma.attempt.update({
        where: { id: attemptId },
        data: { status: "EXPIRED", finishedAt: new Date() },
      });
      return { success: false, message: "Waktu ujian telah berakhir." };
    }

    // Upsert answer
    await prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      create: {
        attemptId,
        questionId,
        choice,
      },
      update: {
        choice,
      },
    });

    // SEC-02: Never return answerKey!
    return {
      success: true,
      savedChoice: choice,
    };
  } catch (err: unknown) {
    console.error("Save answer error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menyimpan jawaban.",
    };
  }
}

export async function submitExam(attemptId: string) {
  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "Unknown";

  try {
    const { user } = await requireRole(["STUDENT", "ADMIN"]);

    const validation = SubmitExamSchema.safeParse({ attemptId });
    if (!validation.success) {
      return { success: false, message: "ID Sesi ujian tidak valid." };
    }

    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        userId: user.id,
        status: "IN_PROGRESS",
        deletedAt: null,
      },
    });

    if (!attempt) {
      return { success: false, message: "Sesi ujian tidak ditemukan atau sudah disubmit." };
    }

    // Mark as finished
    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
      },
    });

    // Clear timer in Redis
    await clearAttemptTimer(attemptId);

    // SEC-05, SEC-06: Audit Logging
    await createAuditLog({
      userId: user.id,
      action: "EXAM_SUBMITTED",
      entity: "Attempt",
      entityId: attempt.id,
      metadata: {
        attemptId,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: "Ujian berhasil diselesaikan dan disubmit.",
    };
  } catch (err: unknown) {
    console.error("Submit exam error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal mengumpulkan ujian.",
    };
  }
}

