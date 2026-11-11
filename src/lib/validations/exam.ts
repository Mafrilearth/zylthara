import { z } from "zod";

export const StartExamSchema = z.object({
  scheduleId: z.string().uuid("ID Jadwal tidak valid"),
});

export const SaveAnswerSchema = z.object({
  attemptId: z.string().uuid("ID Sesi Ujian tidak valid"),
  questionId: z.string().uuid("ID Soal tidak valid"),
  choice: z.string().min(1, "Pilihan jawaban wajib diisi"),
});

export const SubmitExamSchema = z.object({
  attemptId: z.string().uuid("ID Sesi Ujian tidak valid"),
});
