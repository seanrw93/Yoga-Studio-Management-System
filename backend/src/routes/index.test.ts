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
import { generateToken } from "../utils/jwt.util";

const {
  sessionFindUniqueMock,
  MockPrismaClient,
  AuthControllerMock,
  SessionControllerMock,
  TeacherControllerMock,
  UserControllerMock,
} = vi.hoisted(() => {
  const sessionFindUniqueMock = vi.fn();

  const send =
    (status: number, body: unknown) =>
    async (_req: express.Request, res: express.Response): Promise<void> => {
      res.status(status).json(body);
    };

  class AuthControllerMock {
    login = send(200, { route: "login" });
    register = send(201, { route: "register" });
  }

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

  class TeacherControllerMock {
    getAll = send(200, { route: "getAllTeachers" });
    getById = send(200, { route: "getTeacherById" });
  }

  class UserControllerMock {
    getById = send(200, { route: "getUserById" });
    promoteSelfToAdmin = send(200, { route: "promoteSelfToAdmin" });
    delete = send(200, { route: "deleteUser" });
  }

  class MockPrismaClient {
    user = {
      findUnique: sessionFindUniqueMock,
    };
  }

  return {
    sessionFindUniqueMock,
    MockPrismaClient,
    AuthControllerMock,
    SessionControllerMock,
    TeacherControllerMock,
    UserControllerMock,
  };
});

vi.mock("@prisma/client", () => ({
  PrismaClient: MockPrismaClient,
}));

vi.mock("../controllers/auth.controller", () => ({
  AuthController: AuthControllerMock,
}));

vi.mock("../controllers/session.controller", () => ({
  SessionController: SessionControllerMock,
}));

vi.mock("../controllers/teacher.controller", () => ({
  TeacherController: TeacherControllerMock,
}));

vi.mock("../controllers/user.controller", () => ({
  UserController: UserControllerMock,
}));

import router from "./index";

const app = express();
app.use(express.json());
app.use(router);

let server: Server;
let baseUrl: string;

const request = async (
  path: string,
  userId?: number,
  init: RequestInit = {},
): Promise<Response> => {
  const headers = new Headers(init.headers);

  if (userId !== undefined) {
    headers.set("Authorization", `Bearer ${generateToken(userId)}`);
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });
};

describe("routes/index authorization", () => {
  beforeAll(async () => {
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sessionFindUniqueMock.mockResolvedValue({ admin: false });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

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

  it("reaches every registered route with valid requests", async () => {
    sessionFindUniqueMock.mockResolvedValue({ admin: true });

    const responses = await Promise.all([
      request("/api/auth/login", undefined, {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "password",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      request("/api/auth/register", undefined, {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          firstName: "Jane",
          lastName: "Doe",
          password: "Password1!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
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
      request("/api/teacher", 7),
      request("/api/teacher/3", 7),
      request("/api/user/promote-admin", 7, { method: "POST" }),
      request("/api/user/7", 7, { method: "DELETE" }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      200, 201, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
    ]);
    const participationResponse = responses[7];
    await expect(participationResponse.json()).resolves.toEqual({
      userId: 7,
    });
  });

  it("covers owner and non-owner profile authorization", async () => {
    sessionFindUniqueMock.mockResolvedValue({ admin: false });
    const ownProfile = await request("/api/user/7", 7);
    const forbiddenProfile = await request("/api/user/8", 7);

    sessionFindUniqueMock.mockResolvedValue({ admin: true });
    const adminProfile = await request("/api/user/8", 7);

    expect(ownProfile.status).toBe(200);
    expect(forbiddenProfile.status).toBe(403);
    expect(adminProfile.status).toBe(200);
  });
});
