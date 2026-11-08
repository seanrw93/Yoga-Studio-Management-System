import { z } from "zod";

const sessionNameSchema = z
  .string()
  .trim()
  .min(3, "Session name must be at least 3 characters")
  .max(50, "Session name must be at most 50 characters");

const sessionDateSchema = z.iso.datetime({
  error: "Date must be a valid ISO datetime",
});

const descriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(2500, "Description must be at most 2500 characters");

const teacherIdSchema = z
  .int({ error: "Teacher ID must be an integer" })
  .positive({ error: "Teacher ID must be positive" });

export const CreateSessionSchema = z.object({
  name: sessionNameSchema,
  date: sessionDateSchema,
  description: descriptionSchema,
  teacherId: teacherIdSchema,
});

export const UpdateSessionSchema = z
  .object({
    name: sessionNameSchema.optional(),
    date: sessionDateSchema.optional(),
    description: descriptionSchema.optional(),
    teacherId: teacherIdSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field is required",
  });

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionDto = z.infer<typeof UpdateSessionSchema>;
