import express from "express";
import type { AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import router from ".";
import { generateToken } from "../../utils/jwt.util";

const { AuthControllerMock } = vi.hoisted(() => {
  const send =
    (status: number, body: unknown) =>
    async (_req: express.Request, res: express.Response): Promise<void> => {
      res.status(status).json(body);
    };

  class AuthControllerMock {
    login = send(200, { route: "login" });
    register = send(201, { route: "register" });
  }

  return { AuthControllerMock };
});

vi.mock("../../controllers/auth.controller", () => ({
  AuthController: AuthControllerMock,
}));

const appRouter = express.Router();
appRouter.use("/auth", router);

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

describe("routes/auth", () => {
  beforeAll(async () => {
    ({ baseUrl, server } = await startServer());
    request = createRequest(baseUrl);
  });

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );

  it("reaches login and registration handlers", async () => {
    const [login, register] = await Promise.all([
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
    ]);

    expect(login.status).toBe(200);
    expect(register.status).toBe(201);
  });
});
