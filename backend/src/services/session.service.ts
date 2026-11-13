import { Prisma, PrismaClient } from "@prisma/client";
import createError from "http-errors";
import { SessionResponse } from "../types/session.types";
import { CreateSessionDto, UpdateSessionDto } from "../dto/session.dto";

const sessionInclude = {
  teacher: true,
  participants: { include: { user: true } },
} satisfies Prisma.SessionInclude;

type SessionWithRelations = Prisma.SessionGetPayload<{
  include: typeof sessionInclude;
}>;

const toSessionResponse = (session: SessionWithRelations): SessionResponse => ({
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
});

export class SessionService {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(): Promise<SessionResponse[]> {
    const sessions = await this.prisma.session.findMany({
      include: sessionInclude,
    });
    return sessions.map(toSessionResponse);
  }

  async getById(id: number): Promise<SessionResponse> {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: sessionInclude,
    });
    if (!session) throw createError.NotFound("Session not found");
    return toSessionResponse(session);
  }

  async create(data: CreateSessionDto): Promise<SessionResponse> {
    await this.assertTeacherExists(data.teacherId);

    const session = await this.prisma.session.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        description: data.description,
        teacherId: data.teacherId,
      },
      include: sessionInclude,
    });
    return toSessionResponse(session);
  }

  async update(id: number, data: UpdateSessionDto): Promise<SessionResponse> {
    await this.assertSessionExists(id);

    const updateData: Prisma.SessionUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.teacherId !== undefined) {
      await this.assertTeacherExists(data.teacherId);
      updateData.teacherId = data.teacherId;
    }

    const session = await this.prisma.session.update({
      where: { id },
      data: updateData,
      include: sessionInclude,
    });
    return toSessionResponse(session);
  }

  async delete(id: number): Promise<void> {
    await this.assertSessionExists(id);
    await this.prisma.session.delete({ where: { id } });
  }

  async participate(sessionId: number, userId: number): Promise<void> {
    await this.assertSessionExists(sessionId);

    const existing = await this.prisma.sessionParticipation.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (existing) {
      throw createError.Conflict("User already participating in this session");
    }

    await this.prisma.sessionParticipation.create({
      data: { sessionId, userId },
    });
  }

  async unparticipate(sessionId: number, userId: number): Promise<void> {
    const participation = await this.prisma.sessionParticipation.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (!participation) throw createError.NotFound("Participation not found");

    await this.prisma.sessionParticipation.delete({
      where: { sessionId_userId: { sessionId, userId } },
    });
  }

  private async assertSessionExists(id: number): Promise<void> {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw createError.NotFound("Session not found");
  }

  private async assertTeacherExists(id: number): Promise<void> {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw createError.NotFound("Teacher not found");
  }
}
