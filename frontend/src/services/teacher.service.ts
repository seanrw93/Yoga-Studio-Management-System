import { apiPrivate } from "./api";
import { Teacher } from "../types";

export const teacherService = {
  getAll: async (signal?: AbortSignal): Promise<Teacher[]> => {
    const { data } = await apiPrivate.get<Teacher[]>("/teacher", { signal });
    return data;
  },
  getById: async (id: number, signal?: AbortSignal): Promise<Teacher> => {
    const { data } = await apiPrivate.get<Teacher>(`/teacher/${id}`, {
      signal,
    });
    return data;
  },
};
