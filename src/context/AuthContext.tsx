"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MARKETING_MANAGER" | "CAMPAIGN_OPERATOR" | "VIEWER";
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  hasMinRole: (minRole: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  hasMinRole: () => false,
});

const ROLE_RANKS: Record<string, number> = {
  SUPER_ADMIN: 50,
  ADMIN: 40,
  MARKETING_MANAGER: 30,
  CAMPAIGN_OPERATOR: 20,
  VIEWER: 10,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    setUser(null);
    router.push("/login");
  };

  const hasMinRole = (minRole: string) => {
    if (!user) return false;
    const userRank = ROLE_RANKS[user.role] || 0;
    const minRank = ROLE_RANKS[minRole] || 0;
    return userRank >= minRank;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasMinRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
