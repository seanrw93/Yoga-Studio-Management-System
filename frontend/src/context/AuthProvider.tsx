import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../services/auth.service";
import type { LoginCredentials, RegisterData, User } from "../types";

type AuthContextValues = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValues | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [token, setToken] = useState<string | null>(authService.getToken());

  const login = useCallback(
    async (loginCredentials: LoginCredentials) => {
      const res = await authService?.login(loginCredentials);
      setUser(res);
      setToken(res.token);
    },
    [token, user],
  );

  const register = useCallback(
    async (registerData: RegisterData) => {
      const res = await authService?.register(registerData);
      setUser(res);
      setToken(res.token);
    },
    [user, token],
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, [user, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be inside an AuthProvider");
  }

  return context;
};
