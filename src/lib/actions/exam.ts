"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { checkAttemptTime, clearAttemptTimer, startAttemptTimer } from "@/lib/redis";
import { calculateITPScores } from "@/lib/scoring";
import { SaveAnswerSchema, StartExamSchema, SubmitExamSchema } from "@/lib/validations/exam";

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

export async function saveAnswer(attemptId: string, questionId: string, choice: string) {
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
        status: { in: ["IN_PROGRESS", "FINISHED"] },
        deletedAt: null,
      },
    });

    if (!attempt) {
      return { success: false, message: "Sesi ujian tidak ditemukan." };
    }

    // Clear timer in Redis
    await clearAttemptTimer(attemptId);

    // Fetch all test questions to establish total breakdown per section
    const allQuestions = await prisma.question.findMany({
      where: { deletedAt: null },
      select: { id: true, section: true, answerKey: true },
    });

    const totalQuestionsBySection = {
      LISTENING: allQuestions.filter((q) => q.section === "LISTENING").length,
      STRUCTURE: allQuestions.filter((q) => q.section === "STRUCTURE").length,
      READING: allQuestions.filter((q) => q.section === "READING").length,
    };

    // Fetch test-taker's submitted answers
    const answers = await prisma.answer.findMany({
      where: { attemptId, deletedAt: null },
      include: {
        question: {
          select: {
            section: true,
            answerKey: true,
          },
        },
      },
    });

    // Compute standardized ITP scaled scores
    const scoreResult = calculateITPScores(answers, totalQuestionsBySection);

    // Persist Score record
    const score = await prisma.score.upsert({
      where: { attemptId },
      create: {
        attemptId,
        listeningScore: scoreResult.listeningScore,
        structureScore: scoreResult.structureScore,
        readingScore: scoreResult.readingScore,
        totalScore: scoreResult.totalScore,
      },
      update: {
        listeningScore: scoreResult.listeningScore,
        structureScore: scoreResult.structureScore,
        readingScore: scoreResult.readingScore,
        totalScore: scoreResult.totalScore,
      },
    });

    // Issue Certificate record
    const certCode = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
    const certNo = `ZYL-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const certificate = await prisma.certificate.upsert({
      where: { attemptId },
      create: {
        attemptId,
        certificateNo: certNo,
        verificationCode: `ZYL-VRF-${certCode}`,
        issuedAt: new Date(),
      },
      update: {},
    });

    // Mark attempt as SCORED
    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SCORED",
        finishedAt: new Date(),
      },
    });

    // SEC-05, SEC-06: Audit Logging
    await createAuditLog({
      userId: user.id,
      action: "EXAM_SUBMITTED",
      entity: "Attempt",
      entityId: attempt.id,
      metadata: {
        attemptId,
        totalScore: score.totalScore,
      },
      ipAddress,
      userAgent,
    });

    await createAuditLog({
      userId: user.id,
      action: "CERTIFICATE_ISSUED",
      entity: "Certificate",
      entityId: certificate.id,
      metadata: {
        attemptId,
        certificateNo: certificate.certificateNo,
        verificationCode: certificate.verificationCode,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: "Ujian berhasil dinilai dan sertifikat telah diterbitkan.",
      attemptId,
      score,
      certificate,
    };
  } catch (err: unknown) {
    console.error("Submit exam error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal mengumpulkan ujian.",
    };
  }
}

export async function getExamResult(attemptId: string) {
  try {
    const { user } = await requireRole(["STUDENT", "ADMIN"]);

    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        deletedAt: null,
        ...(user.role !== "ADMIN" ? { userId: user.id } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        schedule: {
          select: {
            id: true,
            location: true,
            date: true,
            startTime: true,
            endTime: true,
          },
        },
        score: true,
        certificate: true,
        answers: {
          select: {
            id: true,
            choice: true,
            question: {
              select: {
                section: true,
              },
            },
          },
        },
      },
    });

    if (!attempt?.score) {
      return { success: false, message: "Hasil ujian belum tersedia." };
    }

    const totalQuestions = await prisma.question.count({
      where: { deletedAt: null },
    });

    return {
      success: true,
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        finishedAt: attempt.finishedAt,
        user: attempt.user,
        schedule: attempt.schedule,
        score: attempt.score,
        certificate: attempt.certificate,
        totalAnswered: attempt.answers.length,
        totalQuestions,
      },
    };
  } catch (err: unknown) {
    console.error("Get exam result error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memuat hasil ujian.",
    };
  }
}
