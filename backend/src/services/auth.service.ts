import { PrismaClient, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import createError from "http-errors";
import { generateToken } from "../utils/jwt.util";
import { AuthResponse } from "../types/auth.types";
import { LoginDto, RegisterDto } from "../dto/auth.dto";

const toAuthResponse = (user: User): AuthResponse => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  admin: user.admin,
  token: generateToken(user.id),
});

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async login({ email, password }: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw createError.Unauthorized("Invalid credentials");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw createError.Unauthorized("Invalid credentials");

    return toAuthResponse(user);
  }

  async register({
    email,
    password,
    firstName,
    lastName,
  }: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) throw createError.BadRequest("Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        admin: false,
      },
    });

    return toAuthResponse(user);
  }
}
