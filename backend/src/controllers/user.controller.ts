import { Request, Response } from "express";
import createError from "http-errors";
import { parseId } from "../utils/parse-id.util";
import { UserService } from "../services/user.service";
import { env } from "../config/env";

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getById(req: Request, res: Response) {
    const userId = parseId(req.params.id);
    if (userId === null) throw createError.BadRequest("Invalid user ID");

    const user = await this.userService.getById(userId);
    return res.status(200).json(user);
  }

  async delete(req: Request, res: Response) {
    const userId = parseId(req.params.id);
    if (userId === null) throw createError.BadRequest("Invalid user ID");

    if (req.userId !== userId) {
      throw createError.Forbidden("You can only delete your own account");
    }

    await this.userService.delete(userId);
    return res.status(200).json({ message: "User deleted successfully" });
  }

  async promoteSelfToAdmin(req: Request, res: Response) {
    const selfPromotionEnabled =
      env.NODE_ENV === "development" &&
      env.ENABLE_ADMIN_SELF_PROMOTION === "true";

    if (!selfPromotionEnabled) {
      throw createError.Forbidden(
        "Admin self-promotion is only available in development",
      );
    }

    if (!req.userId) throw createError.Unauthorized("Unauthorized");

    const user = await this.userService.promoteToAdmin(req.userId);
    return res.status(200).json(user);
  }
}
