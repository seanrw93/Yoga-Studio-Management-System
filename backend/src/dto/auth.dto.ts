import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9\s]/,
    "Password must contain at least one special character",
  );

export const LoginSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  firstName: z.string().trim().min(2).max(20),
  lastName: z.string().trim().min(2).max(20),
  password: passwordSchema,
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
