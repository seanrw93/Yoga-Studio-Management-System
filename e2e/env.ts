// Separate database so E2E runs never touch dev data. Credentials match docker-compose.yml.
export const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://yogauser:yogapass@localhost:5433/yogastudio_e2e";

export const BACKEND_ENV = {
  DATABASE_URL,
  NODE_ENV: "test",
  PORT: "8080",
  JWT_SECRET: "e2e-only-secret-that-is-at-least-32-characters",
  CORS_ORIGIN: "http://localhost:3000",
  ENABLE_ADMIN_SELF_PROMOTION: "false",
};
