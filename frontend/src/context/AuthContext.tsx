import { createContext, useContext, useState, ReactNode } from "react";
import api from "../api/axios";

// The shape of what AuthContext provides to any component that uses useAuth()
interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// 1. Create the "intercom channel" — starts as null (no one broadcasting yet)
const AuthContext = createContext<AuthContextType | null>(null);

// 2. The Provider component — wraps the entire app in main.tsx
//    It holds the user state and provides login/register/logout functions.
//    When user state changes, every component using useAuth() re-renders.
export function AuthProvider({ children }: { children: ReactNode }) {
  // On first load, check if we already have a user saved from a previous session.
  // localStorage persists across page refreshes (unlike React state which resets).
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  // login() — calls POST /api/auth/login, saves the JWT token + user object
  async function login(email: string, password: string) {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  // register() — calls POST /api/auth/register, same flow as login
  async function register(name: string, email: string, password: string) {
    const { data } = await api.post("/api/auth/register", { name, email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  // logout() — tells backend to invalidate session, clears local storage
  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // If logout API fails (e.g. already expired), that's fine — just clear locally
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. The hook — any component calls useAuth() to get { user, login, register, logout }
//    Example: const { user, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
