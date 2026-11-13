import { Request, Response } from "express";
import createError from "http-errors";
import { parseId } from "../utils/parse-id.util";
import { SessionService } from "../services/session.service";

const parseSessionId = (req: Request): number => {
  const sessionId = parseId(req.params.id);
  if (sessionId === null) throw createError.BadRequest("Invalid session ID");
  return sessionId;
};

const requireUserId = (req: Request): number => {
  if (!req.userId) throw createError.Unauthorized("Authentication required");
  return req.userId;
};

export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  async getAll(_req: Request, res: Response) {
    const sessions = await this.sessionService.getAll();
    return res.status(200).json(sessions);
  }

  async getById(req: Request, res: Response) {
    const session = await this.sessionService.getById(parseSessionId(req));
    return res.status(200).json(session);
  }

  async create(req: Request, res: Response) {
    const session = await this.sessionService.create(req.body);
    return res.status(201).json(session);
  }

  async update(req: Request, res: Response) {
    const session = await this.sessionService.update(
      parseSessionId(req),
      req.body,
    );
    return res.status(200).json(session);
  }

  async delete(req: Request, res: Response) {
    await this.sessionService.delete(parseSessionId(req));
    return res.status(200).json({ message: "Session deleted successfully" });
  }

  async participate(req: Request, res: Response) {
    const userId = requireUserId(req);
    const sessionId = parseSessionId(req);

    await this.sessionService.participate(sessionId, userId);
    return res.status(200).json({ message: "Successfully joined the session" });
  }

  async unparticipate(req: Request, res: Response) {
    const sessionId = parseSessionId(req);
    const userId = requireUserId(req);

    await this.sessionService.unparticipate(sessionId, userId);
    return res.status(200).json({ message: "Successfully left the session" });
  }
}
