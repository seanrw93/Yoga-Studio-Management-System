import express from "express";
import type { AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import router from ".";
import { generateToken } from "../../utils/jwt.util";

const { TeacherControllerMock } = vi.hoisted(() => {
  const send =
    (body: unknown) =>
    async (_req: express.Request, res: express.Response): Promise<void> => {
      res.status(200).json(body);
    };

  class TeacherControllerMock {
    getAll = send({ route: "getAllTeachers" });
    getById = send({ route: "getTeacherById" });
  }

  return { TeacherControllerMock };
});

vi.mock("../../controllers/teacher.controller", () => ({
  TeacherController: TeacherControllerMock,
}));

const appRouter = express.Router();
appRouter.use("/teacher", router);

const createRequest = (baseUrl: string) => {
  return async (path: string, userId?: number): Promise<Response> => {
    const headers = new Headers();

    if (userId !== undefined) {
      headers.set("Authorization", `Bearer ${generateToken(userId)}`);
    }

    return fetch(`${baseUrl}${path}`, { headers });
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

describe("routes/teacher", () => {
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

  it("reaches the teacher handlers with valid requests", async () => {
    const [teachers, teacher] = await Promise.all([
      request("/api/teacher", 7),
      request("/api/teacher/3", 7),
    ]);

    expect(teachers.status).toBe(200);
    expect(teacher.status).toBe(200);
  });
});
