import { apiPublic } from "./api";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "../types";

const isUser = (value: unknown): value is User => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    Number.isInteger(user.id) &&
    typeof user.email === "string" &&
    typeof user.firstName === "string" &&
    typeof user.lastName === "string" &&
    typeof user.admin === "boolean"
  );
};

const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem("user");

  if (!userStr) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(userStr);

    if (!isUser(parsed)) {
      localStorage.removeItem("user");
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

const persistAuth = ({ token, ...user }: AuthResponse): void => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await apiPublic.post<AuthResponse>("/auth/login", credentials);
    if (res.data.token) {
      persistAuth(res.data);
    }
    return res.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const res = await apiPublic.post<AuthResponse>("/auth/register", data);
    if (res.data.token) {
      persistAuth(res.data);
    }
    return res.data;
  },

  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: (): User | null => {
    return getStoredUser();
  },

  updateCurrentUser: (updates: Partial<User>): User | null => {
    const existing = getStoredUser();

    if (!existing) {
      return null;
    }

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
