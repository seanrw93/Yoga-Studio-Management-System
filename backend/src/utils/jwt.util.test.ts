import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateToken, verifyToken } from "./jwt.util";

// Must match JWT_SECRET in vitest.config.mts
const TEST_SECRET = "test-secret";

describe("jwt.util", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("generates a JWT string for a valid user ID", () => {
    const token = generateToken(42);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("generates and verifies a token", () => {
    const token = generateToken(42);

    expect(verifyToken(token)).toEqual({ userId: 42 });
  });

  it("signs the token with the configured secret", () => {
    const token = generateToken(42);

    expect(jwt.verify(token, TEST_SECRET)).toMatchObject({ userId: 42 });
  });

  it("rejects an expired token", () => {
    const token = jwt.sign({ userId: 42 }, TEST_SECRET, { expiresIn: -10 });

    expect(verifyToken(token)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const token = jwt.sign({ userId: 42 }, "another-secret");

    expect(verifyToken(token)).toBeNull();
  });

  it("rejects a malformed token", () => {
    expect(verifyToken("not-a-jwt")).toBeNull();
  });

  it("rejects a token with a string payload", () => {
    const token = jwt.sign("just-a-string", TEST_SECRET);

    expect(verifyToken(token)).toBeNull();
  });

  it("rejects a token without a userId", () => {
    const token = jwt.sign({}, TEST_SECRET);

    expect(verifyToken(token)).toBeNull();
  });

  it("rejects a token whose userId is not a number", () => {
    const token = jwt.sign({ userId: "42" }, TEST_SECRET);

    expect(verifyToken(token)).toBeNull();
  });

  it("rejects a token whose userId is not an integer", () => {
    const token = generateToken(1.5);

    expect(verifyToken(token)).toBeNull();
  });

  it("rejects a token whose userId is zero", () => {
    const token = generateToken(0);

    expect(verifyToken(token)).toBeNull();
  });

  it("rejects a token whose userId is negative", () => {
    const token = generateToken(-1);

    expect(verifyToken(token)).toBeNull();
  });

  it("rejects a token whose userId is an unsafe integer", () => {
    const token = generateToken(2 ** 53);

    expect(verifyToken(token)).toBeNull();
  });
  
  it("generates a token that expires after 24 hours", () => {
    const token = generateToken(42);
    const { iat, exp } = jwt.verify(token, TEST_SECRET) as jwt.JwtPayload;

    expect(exp! - iat!).toBe(24 * 60 * 60);
  });


  it("throws on import when JWT_SECRET is missing", async () => {
    vi.stubEnv("JWT_SECRET", "");
    vi.resetModules();

    await expect(import("./jwt.util")).rejects.toThrow(
      "JWT_SECRET must be configured",
    );
  });
});
