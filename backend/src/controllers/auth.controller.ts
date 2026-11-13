import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response) {
    const auth = await this.authService.login(req.body);
    return res.status(200).json(auth);
  }

  async register(req: Request, res: Response) {
    const auth = await this.authService.register(req.body);
    return res.status(201).json(auth);
  }
}
