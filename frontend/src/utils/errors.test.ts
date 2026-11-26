import { describe, expect, it } from "vitest";
import { getErrorMessage, getServerFieldErrors } from "./errors";
import { AxiosError } from "axios";

const mockAxiosError = (data: unknown) => {
  return new AxiosError("fail", "ERR_BAD_REQUEST", undefined, undefined, {
    data,
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: {} as never,
  });
};

describe("getErrorMessage", () => {
  it("returns server message for an axios error", () => {
    expect(
      getErrorMessage(mockAxiosError({ message: "Hello, world!" }), "fallback"),
    ).toBe("Hello, world!");
  });
  it("returns fallback for an axios error with no response", () => {
    expect(getErrorMessage(new AxiosError("fail"), "fallback")).toBe(
      "fallback",
    );
  });
  it("returns fallback when an axios response has no data", () => {
    expect(getErrorMessage(mockAxiosError(undefined), "fallback")).toBe(
      "fallback",
    );
  });
  it("returns fallback when a plain Error", () => {
    expect(getErrorMessage(new Error("Hello, world!"), "fallback")).toBe(
      "fallback",
    );
  });
});

describe("getServerFieldsError", () => {
  it("returns an empty object when null", () => {
    expect(getServerFieldErrors(null)).toEqual({});
  });
  it("returns an empty object when empty object", () => {
    expect(getServerFieldErrors({})).toEqual({});
  });
  it("returns an empty object when { errors: {} }", () => {
    expect(getServerFieldErrors({ errors: {} })).toEqual({});
  });
  it("returns an empty object for a non-object API response", () => {
    expect(getServerFieldErrors("invalid response")).toEqual({});
  });
  it.each([
    ["null errors", { errors: null }],
    ["null properties", { errors: { properties: null } }],
  ])("returns no field errors for %s", (_description, data) => {
    expect(getServerFieldErrors(data)).toEqual({});
  });
  it("skips fields with no string errors", () => {
    const data = {
      errors: {
        properties: { email: { errors: [42] }, name: {}, invalid: null },
      },
    };
    expect(getServerFieldErrors(data)).toStrictEqual({});
  });
  it("returns the first string validation error for each field", () => {
    const data = {
      errors: {
        properties: {
          email: { errors: [42, "Email is invalid", "Another error"] },
          password: { errors: ["Password is too short"] },
        },
      },
    };

    expect(getServerFieldErrors(data)).toEqual({
      email: "Email is invalid",
      password: "Password is too short",
    });
  });
});
