"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  Moon,
  Plus,
  Radio,
  Bell,
  Search,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const [apiStatus, setApiStatus] = useState<any>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setApiStatus(data.apiStatus);
        }
      } catch (e) {}
    }
    fetchStatus();
  }, []);

  // Format title based on pathname
  const getPageTitle = () => {
    if (!pathname || pathname === "/" || pathname === "/dashboard") return "Executive Dashboard";
    if (pathname.startsWith("/contacts")) return "Contact Management & CRM";
    if (pathname.startsWith("/groups")) return "Customer Groups & Segments";
    if (pathname.startsWith("/campaigns")) return "WhatsApp Campaign Manager";
    if (pathname.startsWith("/templates")) return "Message Template Manager";
    if (pathname.startsWith("/scheduler")) return "Campaign Scheduler";
    if (pathname.startsWith("/media")) return "Digital Media Library";
    if (pathname.startsWith("/inbox")) return "WhatsApp Live Inbox";
    if (pathname.startsWith("/analytics")) return "Performance Analytics & Reports";
    if (pathname.startsWith("/settings")) return "System Settings & Security";
    return "SPECS BUDDY Suite";
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            SPECS BUDDY WhatsApp Marketing Suite
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Gateway Status Pill */}
        <Link
          href="/settings"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
            apiStatus?.gatewayMode === "WHATSAPP_WEB"
              ? "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800 hover:bg-teal-100"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100"
          }`}
          title="Click to view & switch WhatsApp Gateway settings"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {apiStatus?.gatewayMode === "WHATSAPP_WEB" ? (
            <>
              <span>WhatsApp Web Linked</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-200/60 dark:bg-teal-900 text-teal-900 dark:text-teal-200">
                {apiStatus?.webConnectedPhone || "Connected"}
              </span>
            </>
          ) : (
            <>
              <span>
                {apiStatus?.isTestMode ? "Meta Cloud API (Sandbox)" : "Meta Cloud API Connected"}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-200/50 dark:bg-emerald-900">
                {apiStatus?.messagingLimit?.replace("TIER_", "Tier ") || "Tier 1"}
              </span>
            </>
          )}
        </Link>

        {/* Quick New Campaign Button */}
        <Link
          href="/campaigns/new"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Campaign</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {user?.name?.charAt(0) || "S"}
          </div>
        </div>
      </div>
    </header>
  );
}
