import { UserResponse } from "./user.types";

export type TeacherResponse = Omit<UserResponse, "admin" | "email">;
