import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive().max(65535),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.url(),
  ENABLE_ADMIN_SELF_PROMOTION: z.enum(["true", "false"]).default("false"),
});

export const env = envSchema.parse(process.env);
