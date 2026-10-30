import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { SessionResponse } from "../types/session.types";

const prisma = new PrismaClient();

export class SessionController {
  async getAll(req: Request, res: Response) {
    try {
      const sessions = await prisma.session.findMany({
        include: {
          teacher: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      const response: SessionResponse[] = sessions.map((session) => ({
        id: session.id,
        name: session.name,
        date: session.date,
        description: session.description,
        teacher: {
          id: session.teacher.id,
          firstName: session.teacher.firstName,
          lastName: session.teacher.lastName,
        },
        users: session.participants.map((p) => p.user.id),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }));

      return res.status(200).json(response);
    } catch (error: unknown) {
      console.error("Get sessions error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      const sessionId = parseInt(id);

      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          teacher: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const response: SessionResponse = {
        id: session.id,
        name: session.name,
        date: session.date,
        description: session.description,
        teacher: {
          id: session.teacher.id,
          firstName: session.teacher.firstName,
          lastName: session.teacher.lastName,
        },
        users: session.participants.map((p) => p.user.id),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };

      return res.status(200).json(response);
    } catch (error: unknown) {
      console.error("Get session error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, date, description, teacherId } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID is required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (!user || !user.admin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
      });

      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      const session = await prisma.session.create({
        data: {
          name,
          date: new Date(date),
          description,
          teacherId,
        },
        include: {
          teacher: true,
          participants: true,
        },
      });

      const response: SessionResponse = {
        id: session.id,
        name: session.name,
        date: session.date,
        description: session.description,
        teacher: {
          id: session.teacher.id,
          firstName: session.teacher.firstName,
          lastName: session.teacher.lastName,
        },
        users: [],
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };

      return res.status(201).json(response);
    } catch (error: unknown) {
      console.error("Create session error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { name, date, description, teacherId } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      const sessionId = parseInt(id);

      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (!user || !user.admin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const existingSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!existingSession) {
        return res.status(404).json({ message: "Session not found" });
      }

      const updateData: Prisma.SessionUncheckedUpdateInput = {};
      if (name) updateData.name = name;
      if (date) updateData.date = new Date(date);
      if (description) updateData.description = description;
      if (teacherId) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: teacherId },
        });
        if (!teacher) {
          return res.status(404).json({ message: "Teacher not found" });
        }
        updateData.teacherId = teacherId;
      }

      const session = await prisma.session.update({
        where: { id: sessionId },
        data: updateData,
        include: {
          teacher: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      const response: SessionResponse = {
        id: session.id,
        name: session.name,
        date: session.date,
        description: session.description,
        teacher: {
          id: session.teacher.id,
          firstName: session.teacher.firstName,
          lastName: session.teacher.lastName,
        },
        users: session.participants.map((p: any) => p.user.id),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error("Update session error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      const sessionId = parseInt(id);

      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (!user || !user.admin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const existingSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!existingSession) {
        return res.status(404).json({ message: "Session not found" });
      }

      await prisma.session.delete({
        where: { id: sessionId },
      });

      return res.status(200).json({ message: "Session deleted successfully" });
    } catch (error: any) {
      console.error("Delete session error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async participate(req: Request, res: Response) {
    try {
      const sessionId = Number(req.params.id);
      const participantUserId = req.userId;

      if (!participantUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!Number.isInteger(sessionId) || sessionId <= 0) {
        return res.status(400).json({
          message: "Invalid session ID",
        });
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({
          message: "Session not found",
        });
      }

      const existingParticipation =
        await prisma.sessionParticipation.findUnique({
          where: {
            sessionId_userId: {
              sessionId,
              userId: participantUserId,
            },
          },
        });

      if (existingParticipation) {
        return res.status(409).json({
          message: "User already participating in this session",
        });
      }

      await prisma.sessionParticipation.create({
        data: {
          sessionId,
          userId: participantUserId,
        },
      });

      return res.status(200).json({
        message: "Successfully joined the session",
      });
    } catch (error: unknown) {
      console.error("Participate error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async unparticipate(req: Request, res: Response) {
    try {
      const sessionId = Number(req.params.id);

      if (!sessionId) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const participation = await prisma.sessionParticipation.findUnique({
        where: {
          sessionId_userId: {
            sessionId,
            userId,
          },
        },
      });

      if (!participation) {
        return res.status(404).json({ message: "Participation not found" });
      }

      await prisma.sessionParticipation.delete({
        where: {
          sessionId_userId: {
            sessionId,
            userId,
          },
        },
      });

      return res.status(200).json({
        message: "Successfully left the session",
      });
    } catch (error: unknown) {
      console.error("Unparticipate error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
