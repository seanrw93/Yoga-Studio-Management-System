import { afterEach, describe, expect, it, vi } from "vitest";

const validEnv = {
  NODE_ENV: "test",
  PORT: "8080",
  DATABASE_URL: "postgresql://localhost:5432/test",
  JWT_SECRET: "a-secure-test-secret-that-is-at-least-32-chars",
  CORS_ORIGIN: "http://localhost:5173",
  ENABLE_ADMIN_SELF_PROMOTION: "false",
};

describe("environment configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("accepts a valid development configuration", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PORT", validEnv.PORT);
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    vi.stubEnv("CORS_ORIGIN", validEnv.CORS_ORIGIN);
    vi.stubEnv(
      "ENABLE_ADMIN_SELF_PROMOTION",
      validEnv.ENABLE_ADMIN_SELF_PROMOTION,
    );

    const { env } = await import("./env");

    expect(env.NODE_ENV).toBe("development");
    expect(env.CORS_ORIGIN).toBe(validEnv.CORS_ORIGIN);
  });

  it("accepts a valid production configuration", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PORT", validEnv.PORT);
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    vi.stubEnv("CORS_ORIGIN", "https://yoga.example.com");
    vi.stubEnv(
      "ENABLE_ADMIN_SELF_PROMOTION",
      validEnv.ENABLE_ADMIN_SELF_PROMOTION,
    );

    const { env } = await import("./env");

    expect(env.NODE_ENV).toBe("production");
    expect(env.CORS_ORIGIN).toBe("https://yoga.example.com");
  });

  it("coerces PORT from a string", async () => {
    vi.stubEnv("NODE_ENV", validEnv.NODE_ENV);
    vi.stubEnv("PORT", "3000");
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    vi.stubEnv("CORS_ORIGIN", validEnv.CORS_ORIGIN);
    vi.stubEnv(
      "ENABLE_ADMIN_SELF_PROMOTION",
      validEnv.ENABLE_ADMIN_SELF_PROMOTION,
    );

    const { env } = await import("./env");

    expect(env.PORT).toBe(3000);
    expect(typeof env.PORT).toBe("number");
  });

  it("rejects missing required variables", async () => {
    vi.stubEnv("NODE_ENV", "");
    vi.stubEnv("PORT", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("JWT_SECRET", "");
    vi.stubEnv("CORS_ORIGIN", "");

    await expect(import("./env")).rejects.toThrow();
  });

  it("rejects an invalid NODE_ENV", async () => {
    vi.stubEnv("NODE_ENV", "staging");
    vi.stubEnv("PORT", validEnv.PORT);
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    vi.stubEnv("CORS_ORIGIN", validEnv.CORS_ORIGIN);

    await expect(import("./env")).rejects.toThrow();
  });

  it("rejects an invalid PORT", async () => {
    vi.stubEnv("NODE_ENV", validEnv.NODE_ENV);
    vi.stubEnv("PORT", "not-a-port");
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    vi.stubEnv("CORS_ORIGIN", validEnv.CORS_ORIGIN);

    await expect(import("./env")).rejects.toThrow();
  });

  it("rejects a weak JWT_SECRET", async () => {
    vi.stubEnv("NODE_ENV", validEnv.NODE_ENV);
    vi.stubEnv("PORT", validEnv.PORT);
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("JWT_SECRET", "too-short");
    vi.stubEnv("CORS_ORIGIN", validEnv.CORS_ORIGIN);

    await expect(import("./env")).rejects.toThrow();
  });

  it("rejects an invalid CORS_ORIGIN", async () => {
    vi.stubEnv("NODE_ENV", validEnv.NODE_ENV);
    vi.stubEnv("PORT", validEnv.PORT);
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    vi.stubEnv("CORS_ORIGIN", "not-a-url");

    await expect(import("./env")).rejects.toThrow();
  });

  it("defaults admin self-promotion to false", async () => {
    vi.stubEnv("NODE_ENV", validEnv.NODE_ENV);
    vi.stubEnv("PORT", validEnv.PORT);
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    vi.stubEnv("CORS_ORIGIN", validEnv.CORS_ORIGIN);
    vi.stubEnv("ENABLE_ADMIN_SELF_PROMOTION", undefined);

    const { env } = await import("./env");

    expect(env.ENABLE_ADMIN_SELF_PROMOTION).toBe("false");
  });

  it("rejects invalid admin self-promotion values", async () => {
    vi.stubEnv("NODE_ENV", validEnv.NODE_ENV);
    vi.stubEnv("PORT", validEnv.PORT);
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    vi.stubEnv("CORS_ORIGIN", validEnv.CORS_ORIGIN);
    vi.stubEnv("ENABLE_ADMIN_SELF_PROMOTION", "yes");

    await expect(import("./env")).rejects.toThrow();
  });
});
