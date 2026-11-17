import { apiPrivate } from "./api";
import { User } from "../types";

export const userService = {
  getById: async (id: number, signal?: AbortSignal): Promise<User> => {
    const { data } = await apiPrivate.get<User>(`/user/${id}`, { signal });
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await apiPrivate.delete(`/user/${id}`);
  },
  promoteToAdmin: async (): Promise<User> => {
    const { data } = await apiPrivate.post<User>("/user/promote-admin");
    return data;
  },
};
