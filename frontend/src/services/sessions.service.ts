import { apiPrivate } from "./api";
import { Session, SessionFormData } from "../types";

export const sessionService = {
  getAll: async (signal?: AbortSignal): Promise<Session[]> => {
    const { data } = await apiPrivate.get<Session[]>("/session", { signal });
    return data;
  },
  getById: async (id: number, signal?: AbortSignal): Promise<Session> => {
    const { data } = await apiPrivate.get<Session>(`/session/${id}`, {
      signal,
    });
    return data;
  },
  create: async (formData: SessionFormData): Promise<Session> => {
    const { data } = await apiPrivate.post<Session>("/session", formData);
    return data;
  },
  update: async (id: number, formData: SessionFormData): Promise<Session> => {
    const { data } = await apiPrivate.put<Session>(`/session/${id}`, formData);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await apiPrivate.delete(`/session/${id}`);
  },
  participate: async (id: number): Promise<void> => {
    await apiPrivate.post(`/session/${id}/participate`);
  },
  unparticipate: async (id: number): Promise<void> => {
    await apiPrivate.delete(`/session/${id}/participate`);
  },
};
