import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, type RegisterFormData } from "./auth.dto";

const validRegistration = {
  firstName: "Yoga",
  lastName: "Member",
  email: "member@example.com",
  password: "Str0ng!Pass",
};

describe("auth form schemas", () => {
  it("trims a valid login email", () => {
    expect(
      loginSchema.parse({ email: " member@example.com ", password: "secret" }),
    ).toEqual({ email: "member@example.com", password: "secret" });
  });

  it("reports invalid login email and empty password", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual([
        "Enter a valid email address",
        "Password is required",
      ]);
    }
  });

  it("trims registration names and email", () => {
    expect(
      registerSchema.parse({
        ...validRegistration,
        firstName: " Yoga ",
        lastName: " Member ",
        email: " member@example.com ",
      }),
    ).toEqual(validRegistration);
  });

  it.each([
    {
      field: "firstName",
      value: "A",
      message: "First name must be at least 2 characters",
    },
    {
      field: "firstName",
      value: "A".repeat(21),
      message: "First name must not exceed 20 characters",
    },
    {
      field: "lastName",
      value: "A",
      message: "Last name must be at least 2 characters",
    },
    {
      field: "lastName",
      value: "A".repeat(21),
      message: "Last name must not exceed 20 characters",
    },
    {
      field: "email",
      value: "not-an-email",
      message: "Enter a valid email address",
    },
    {
      field: "password",
      value: "A1!",
      message: "Password must be at least 8 characters",
    },
    {
      field: "password",
      value: `A1!${"a".repeat(126)}`,
      message: "Password must not exceed 128 characters",
    },
    {
      field: "password",
      value: "lowercase1!",
      message: "Password must include at least one uppercase letter",
    },
    {
      field: "password",
      value: "Password!",
      message: "Password must include at least one number",
    },
    {
      field: "password",
      value: "Password1",
      message: "Password must include at least one special character",
    },
  ] satisfies Array<{
    field: keyof RegisterFormData;
    value: string;
    message: string;
  }>)(
    "rejects invalid $field with its corresponding message",
    ({ field, value, message }) => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        [field]: value,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.map((issue) => issue.message)).toContain(
          message,
        );
      }
    },
  );
});
