import { UserResponse } from "./user.types";

export type AuthResponse = Omit<UserResponse, "createdAt" | "updatedAt"> & {
  token: string;
};
