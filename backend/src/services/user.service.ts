import { PrismaClient, User } from "@prisma/client";
import createError from "http-errors";
import { UserResponse } from "../types/user.types";

const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  admin: user.admin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async getById(id: number): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw createError.NotFound("User not found");
    return toUserResponse(user);
  }

  async delete(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw createError.NotFound("User not found");

    await this.prisma.user.delete({ where: { id } });
  }

  async promoteToAdmin(id: number): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw createError.NotFound("User not found");

    if (user.admin) return toUserResponse(user);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { admin: true },
    });
    return toUserResponse(updatedUser);
  }
}
