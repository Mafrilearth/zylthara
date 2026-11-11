import { z } from "zod";

export const CreateScheduleSchema = z.object({
  date: z.string().min(1, "Tanggal ujian wajib diisi"),
  startTime: z.string().min(1, "Waktu mulai wajib diisi"),
  endTime: z.string().min(1, "Waktu selesai wajib diisi"),
  location: z.string().min(2, "Lokasi ujian minimal 2 karakter"),
  quota: z.coerce.number().int().positive("Kuota harus lebih dari 0"),
});

export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

export const BookScheduleSchema = z.object({
  scheduleId: z.string().uuid("ID Jadwal tidak valid"),
});

export type BookScheduleInput = z.infer<typeof BookScheduleSchema>;
