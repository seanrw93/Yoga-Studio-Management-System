import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { parseId } from "../utils/parse-id.util";
import { TeacherResponse } from "../types/teacher.types";

const prisma = new PrismaClient();

export class TeacherController {
  async getAll(req: Request, res: Response) {
    try {
      const teachers = await prisma.teacher.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      const response: TeacherResponse[] = teachers.map(
        (teacher: TeacherResponse) => ({
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
        }),
      );

      return res.status(200).json(response);
    } catch (error: unknown) {
      console.error("Get teachers error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const teacherId = parseId(req.params.id);

      if (teacherId === null) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }

      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
      });

      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      const response: TeacherResponse = {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      };

      return res.status(200).json(response);
    } catch (error: unknown) {
      console.error("Get teacher error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
