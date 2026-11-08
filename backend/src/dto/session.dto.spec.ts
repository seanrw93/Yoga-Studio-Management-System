import { describe, expect, it } from "vitest";
import { CreateSessionSchema, UpdateSessionSchema } from "./session.dto";

describe("CreateSessionSchema", () => {
  const validSession = {
    name: "  Morning Flow  ",
    date: "2026-12-01T10:00:00.000Z",
    description: "  A gentle yoga session  ",
    teacherId: 3,
  };

  it("accepts valid session data and trims text fields", () => {
    const result = CreateSessionSchema.safeParse(validSession);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Morning Flow");
      expect(result.data.description).toBe("A gentle yoga session");
    }
  });

  it("rejects an invalid datetime", () => {
    expect(
      CreateSessionSchema.safeParse({
        ...validSession,
        date: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it.each([0, -1, 1.5])("rejects an invalid teacher ID: %s", (teacherId) => {
    expect(
      CreateSessionSchema.safeParse({
        ...validSession,
        teacherId,
      }).success,
    ).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(
      CreateSessionSchema.safeParse({
        ...validSession,
        description: "   ",
      }).success,
    ).toBe(false);
  });
});

describe("UpdateSessionSchema", () => {
  it("accepts a partial update", () => {
    expect(
      UpdateSessionSchema.safeParse({ name: "Evening Flow" }).success,
    ).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(UpdateSessionSchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid values in a partial update", () => {
    expect(UpdateSessionSchema.safeParse({ teacherId: 1.5 }).success).toBe(
      false,
    );
  });
});
