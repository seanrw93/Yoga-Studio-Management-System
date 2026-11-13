import { PrismaClient, Teacher } from "@prisma/client";
import createError from "http-errors";
import { TeacherResponse } from "../types/teacher.types";

const toTeacherResponse = (teacher: Teacher): TeacherResponse => ({
  id: teacher.id,
  firstName: teacher.firstName,
  lastName: teacher.lastName,
  createdAt: teacher.createdAt,
  updatedAt: teacher.updatedAt,
});

export class TeacherService {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(): Promise<TeacherResponse[]> {
    const teachers = await this.prisma.teacher.findMany({
      orderBy: { createdAt: "desc" },
    });
    return teachers.map(toTeacherResponse);
  }

  async getById(id: number): Promise<TeacherResponse> {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw createError.NotFound("Teacher not found");
    return toTeacherResponse(teacher);
  }
}
