import { createContext } from "react";

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  userType: string | number;
  lastLoginAt?: string | null;
  name?: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
