import { Request, Response } from "express";
import createError from "http-errors";
import { parseId } from "../utils/parse-id.util";
import { TeacherService } from "../services/teacher.service";

export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  async getAll(_req: Request, res: Response) {
    const teachers = await this.teacherService.getAll();
    return res.status(200).json(teachers);
  }

  async getById(req: Request, res: Response) {
    const teacherId = parseId(req.params.id);
    if (teacherId === null) throw createError.BadRequest("Invalid teacher ID");

    const teacher = await this.teacherService.getById(teacherId);
    return res.status(200).json(teacher);
  }
}
