import { vi } from "vitest";
import { AxiosError, CanceledError } from "axios";
import { useAuth } from "../context/AuthProvider";
import type { User } from "../types";

export const member: User = {
  id: 1,
  email: "member@example.com",
  firstName: "Yoga",
  lastName: "Member",
  admin: false,
};

export const admin: User = { ...member, id: 2, admin: true };

// Needs vi.mock("../context/AuthProvider", () => ({ useAuth: vi.fn() })) in the test file.
export const mockAuth = (user: User | null) => {
  const value = {
    user,
    token: user ? "token" : null,
    isAuthenticated: Boolean(user),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };
  vi.mocked(useAuth).mockReturnValue(value);
  return value;
};

export const axiosError = (data?: unknown) =>
  new AxiosError(
    "fail",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    data === undefined
      ? undefined
      : {
          data,
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: {} as never,
        },
  );

// A request that only settles (as cancelled) once its signal aborts.
export const rejectOnAbort = (...args: unknown[]) =>
  new Promise<never>((_, reject) =>
    (args.at(-1) as AbortSignal).addEventListener("abort", () =>
      reject(new CanceledError()),
    ),
  );

export const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
