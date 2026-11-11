import express from "express";
import type { AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";
import { describe, expect, it } from "vitest";
import router from "./index";

describe("routes/index", () => {
  it("mounts the resource routers under the API prefix", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api", router);

    const server: Server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const response = await fetch(`${baseUrl}/api/unknown`);
      expect(response.status).toBe(404);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
