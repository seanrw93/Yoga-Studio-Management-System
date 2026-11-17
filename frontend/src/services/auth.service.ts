import { apiPublic } from "./api";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "../types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiPublic.post<AuthResponse>(
      "/auth/login",
      credentials,
    );
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiPublic.post<AuthResponse>("/auth/register", data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  updateCurrentUser: (updates: Partial<User>): User | null => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      return null;
    }
    const existing = JSON.parse(userStr);
    const nextUser = { ...existing, ...updates };
    localStorage.setItem("user", JSON.stringify(nextUser));
    return nextUser;
  },

  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("token");
  },
};
