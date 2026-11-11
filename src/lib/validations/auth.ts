import { z } from "zod";

/**
 * Register validation schema (SSOT - SEC-01, AC-02, AC-04, SEC-10)
 * Data minimization: strictly only name, email, password
 */
export const RegisterSchema = z.object({
  name: z.string().trim().min(2, { message: "Nama harus memiliki minimal 2 karakter" }),
  email: z.string().trim().email({ message: "Format email tidak valid" }).toLowerCase(),
  password: z.string().min(8, { message: "Password minimal harus 8 karakter" }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Login validation schema (SSOT - SEC-01, AC-05)
 */
export const LoginSchema = z.object({
  email: z.string().trim().email({ message: "Format email tidak valid" }).toLowerCase(),
  password: z.string().min(8, { message: "Password minimal harus 8 karakter" }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
