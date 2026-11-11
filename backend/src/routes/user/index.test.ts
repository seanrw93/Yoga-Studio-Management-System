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

const { sessionFindUniqueMock, MockPrismaClient, UserControllerMock } =
  vi.hoisted(() => {
    const sessionFindUniqueMock = vi.fn();
    const send =
      (body: unknown) =>
      async (_req: express.Request, res: express.Response): Promise<void> => {
        res.status(200).json(body);
      };

    class UserControllerMock {
      getById = send({ route: "getUserById" });
      promoteSelfToAdmin = send({ route: "promoteSelfToAdmin" });
      delete = send({ route: "deleteUser" });
    }

    class MockPrismaClient {
      user = { findUnique: sessionFindUniqueMock };
    }

    return { sessionFindUniqueMock, MockPrismaClient, UserControllerMock };
  });

vi.mock("@prisma/client", () => ({ PrismaClient: MockPrismaClient }));
vi.mock("../../controllers/user.controller", () => ({
  UserController: UserControllerMock,
}));

const appRouter = express.Router();
appRouter.use("/user", router);

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

describe("routes/user", () => {
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

  it("reaches the user handlers with valid requests", async () => {
    sessionFindUniqueMock.mockResolvedValue({ admin: true });

    const responses = await Promise.all([
      request("/api/user/promote-admin", 7, { method: "POST" }),
      request("/api/user/7", 7, { method: "DELETE" }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
  });

  it("covers owner and non-owner profile authorization", async () => {
    const ownProfile = await request("/api/user/7", 7);
    const forbiddenProfile = await request("/api/user/8", 7);

    sessionFindUniqueMock.mockResolvedValue({ admin: true });
    const adminProfile = await request("/api/user/8", 7);

    expect(ownProfile.status).toBe(200);
    expect(forbiddenProfile.status).toBe(403);
    expect(adminProfile.status).toBe(200);
  });
});
