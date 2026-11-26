import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { apiPrivate, apiPublic } from "./api";

// Echoes the final request config back as the response body.
const echo: AxiosAdapter = async (config) => ({
  data: config,
  status: 200,
  statusText: "OK",
  headers: {},
  config,
});

const failWith =
  (status: number): AxiosAdapter =>
  async (config) => {
    throw new AxiosError("fail", undefined, config, null, {
      data: {},
      status,
      statusText: "",
      headers: {},
      config,
    });
  };

describe("apiPrivate", () => {
  const assign = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    assign.mockClear();
    vi.stubGlobal("location", { ...window.location, assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON to the api with the stored token as a bearer header", async () => {
    localStorage.setItem("token", "abc");

    const { data } = await apiPrivate.get<InternalAxiosRequestConfig>("/me", {
      adapter: echo,
    });

    expect(data.baseURL).toBe("/api");
    expect(data.headers["Content-Type"]).toBe("application/json");
    expect(data.headers.Authorization).toBe("Bearer abc");
  });

  it("sends no authorization header without a stored token", async () => {
    const { data } = await apiPrivate.get<InternalAxiosRequestConfig>("/me", {
      adapter: echo,
    });

    expect(data.headers.Authorization).toBeUndefined();
  });

  it("clears the stored session and redirects to login on 401", async () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("user", "{}");

    await expect(
      apiPrivate.get("/me", { adapter: failWith(401) }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("keeps the stored session on other errors", async () => {
    localStorage.setItem("token", "abc");

    await expect(
      apiPrivate.get("/me", { adapter: failWith(500) }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(localStorage.getItem("token")).toBe("abc");
    expect(assign).not.toHaveBeenCalled();
  });

  it("passes through network errors that have no response", async () => {
    localStorage.setItem("token", "abc");
    const networkError = new AxiosError("Network Error", "ERR_NETWORK");

    await expect(
      apiPrivate.get("/me", {
        adapter: () => Promise.reject(networkError),
      }),
    ).rejects.toBe(networkError);

    expect(localStorage.getItem("token")).toBe("abc");
  });
});

describe("apiPublic", () => {
  it("targets the api without attaching the stored token", async () => {
    localStorage.setItem("token", "abc");

    const { data } = await apiPublic.get<InternalAxiosRequestConfig>("/x", {
      adapter: echo,
    });

    expect(data.baseURL).toBe("/api");
    expect(data.headers.Authorization).toBeUndefined();
  });
});
