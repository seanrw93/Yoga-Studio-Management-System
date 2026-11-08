import { describe, expect, it } from "vitest";
import { LoginSchema, RegisterSchema } from "./auth.dto";

describe("LoginSchema", () => {
  it("accepts a valid login and trims the email", () => {
    const result = LoginSchema.safeParse({
      email: "  user@example.com  ",
      password: "anything",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects an invalid email", () => {
    expect(
      LoginSchema.safeParse({
        email: "not-an-email",
        password: "anything",
      }).success,
    ).toBe(false);
  });

  it("rejects a missing password", () => {
    expect(
      LoginSchema.safeParse({
        email: "user@example.com",
      }).success,
    ).toBe(false);
  });
});

describe("RegisterSchema", () => {
  const validRegistration = {
    email: "user@example.com",
    firstName: "  Jane  ",
    lastName: "  Doe  ",
    password: "Password1!",
  };

  it("accepts a valid registration and trims names", () => {
    const result = RegisterSchema.safeParse(validRegistration);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.firstName).toBe("Jane");
      expect(result.data.lastName).toBe("Doe");
    }
  });

  it.each(["short1!", "password1!", "Password!", "Password1"])(
    "rejects a password that fails a strength rule: %s",
    (password) => {
      expect(
        RegisterSchema.safeParse({
          ...validRegistration,
          password,
        }).success,
      ).toBe(false);
    },
  );

  it("rejects an invalid email", () => {
    expect(
      RegisterSchema.safeParse({
        ...validRegistration,
        email: "invalid",
      }).success,
    ).toBe(false);
  });

  it("rejects names shorter than two characters", () => {
    expect(
      RegisterSchema.safeParse({
        ...validRegistration,
        firstName: "J",
      }).success,
    ).toBe(false);
  });
});
