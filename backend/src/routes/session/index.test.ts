import express from "express";
import type { AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import router from ".";
import { generateToken } from "../../utils/jwt.util";

const { sessionFindUniqueMock, MockPrismaClient, SessionControllerMock } =
  vi.hoisted(() => {
    const sessionFindUniqueMock = vi.fn();
    const send =
      (status: number, body: unknown) =>
      async (_req: express.Request, res: express.Response): Promise<void> => {
        res.status(status).json(body);
      };

    class SessionControllerMock {
      getAll = send(200, { route: "getAll" });
      getById = send(200, { route: "getById" });
      create = send(200, { route: "create" });
      update = send(200, { route: "update" });
      delete = send(200, { route: "delete" });
      participate = async (
        req: express.Request,
        res: express.Response,
      ): Promise<void> => {
        res.status(200).json({ userId: req.userId });
      };
      unparticipate = async (
        req: express.Request,
        res: express.Response,
      ): Promise<void> => {
        res.status(200).json({ userId: req.userId });
      };
    }

    class MockPrismaClient {
      user = { findUnique: sessionFindUniqueMock };
    }

    return { sessionFindUniqueMock, MockPrismaClient, SessionControllerMock };
  });

vi.mock("@prisma/client", () => ({ PrismaClient: MockPrismaClient }));
vi.mock("../../controllers/session.controller", () => ({
  SessionController: SessionControllerMock,
}));

const appRouter = express.Router();
appRouter.use("/session", router);

const createRequest = (baseUrl: string) => {
  return async (
    path: string,
    userId?: number,
    init: RequestInit = {},
  ): Promise<Response> => {
    const headers = new Headers(init.headers);

    if (userId !== undefined) {
      headers.set("Authorization", `Bearer ${generateToken(userId)}`);
    }

    return fetch(`${baseUrl}${path}`, { ...init, headers });
  };
};

const startServer = async (): Promise<{
  baseUrl: string;
  server: Server;
}> => {
  const app = express();
  app.use(express.json());
  app.use("/api", appRouter);

  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  return { baseUrl: `http://127.0.0.1:${address.port}`, server };
};

let baseUrl: string;
let request: ReturnType<typeof createRequest>;
let server: Server;

describe("routes/session", () => {
  beforeAll(async () => {
    ({ baseUrl, server } = await startServer());
    request = createRequest(baseUrl);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sessionFindUniqueMock.mockResolvedValue({ admin: false });
  });

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );

  it("rejects protected routes without a token", async () => {
    const response = await request("/api/session");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Authentication required",
    });
  });

  it("rejects non-admin users on admin-only session routes", async () => {
    const response = await request("/api/session", 7, { method: "POST" });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "Admin access required",
    });
  });

  it("reaches the session handlers with valid requests", async () => {
    sessionFindUniqueMock.mockResolvedValue({ admin: true });

    const responses = await Promise.all([
      request("/api/session/10", 7),
      request("/api/session", 7),
      request("/api/session", 7, {
        method: "POST",
        body: JSON.stringify({
          name: "Morning Flow",
          date: "2026-12-01T10:00:00.000Z",
          description: "A gentle yoga session",
          teacherId: 3,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      request("/api/session/10", 7, {
        method: "PUT",
        body: JSON.stringify({ name: "Evening Flow" }),
        headers: { "Content-Type": "application/json" },
      }),
      request("/api/session/10", 7, { method: "DELETE" }),
      request("/api/session/10/participate", 7, { method: "POST" }),
      request("/api/session/10/participate", 7, { method: "DELETE" }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      200, 200, 200, 200, 200, 200, 200,
    ]);
    await expect(responses[5].json()).resolves.toEqual({ userId: 7 });
  });
});
