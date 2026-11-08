import { describe, expect, it } from "vitest";
import { parseId } from "./parse-id.util";

describe("parse-id.util", () => {
  it("parses the smallest valid ID", () => {
    expect(parseId("1")).toBe(1);
  });

  it("parses a multi-digit ID", () => {
    expect(parseId("42")).toBe(42);
  });

  it("accepts leading zeros", () => {
    expect(parseId("0012")).toBe(12);
  });

  it("rejects an empty string", () => {
    expect(parseId("")).toBeNull();
  });

  it("rejects zero", () => {
    expect(parseId("0")).toBeNull();
  });

  it("rejects a negative number", () => {
    expect(parseId("-1")).toBeNull();
  });

  it("rejects a decimal", () => {
    expect(parseId("1.5")).toBeNull();
  });

  it("rejects trailing characters", () => {
    expect(parseId("12abc")).toBeNull();
  });

  it("rejects leading characters", () => {
    expect(parseId("abc12")).toBeNull();
  });

  it("rejects whitespace only", () => {
    expect(parseId(" ")).toBeNull();
  });

  it("rejects whitespace inside the value", () => {
    expect(parseId("1 2")).toBeNull();
  });

  it("rejects exponent notation", () => {
    expect(parseId("1e3")).toBeNull();
  });

  it("rejects a decimal with a zero fraction", () => {
    expect(parseId("1.0")).toBeNull();
  });

  it("rejects a number instead of a string", () => {
    expect(parseId(12)).toBeNull();
  });

  it("rejects null", () => {
    expect(parseId(null)).toBeNull();
  });

  it("rejects undefined", () => {
    expect(parseId(undefined)).toBeNull();
  });

  it("rejects a value larger than Number.MAX_SAFE_INTEGER", () => {
    expect(parseId(String(Number.MAX_SAFE_INTEGER + 1))).toBeNull();
  });
});
