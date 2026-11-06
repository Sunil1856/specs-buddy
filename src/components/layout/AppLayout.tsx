"use client";

import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading SPECS BUDDY Suite...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header />
        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
