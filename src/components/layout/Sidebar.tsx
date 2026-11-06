"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Send,
  FileText,
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Glasses,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contacts CRM", href: "/contacts", icon: Users },
  { name: "Customer Groups", href: "/groups", icon: FolderTree },
  { name: "Campaigns", href: "/campaigns", icon: Send },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Scheduler", href: "/scheduler", icon: Calendar },
  { name: "Media Library", href: "/media", icon: ImageIcon },
  { name: "WhatsApp Inbox", href: "/inbox", icon: MessageSquare, badge: "Live" },
  { name: "Analytics & Reports", href: "/analytics", icon: BarChart3 },
  { name: "Settings & Security", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 flex flex-col bg-[#0B132B] text-slate-200 border-r border-slate-800/80 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <Glasses className="w-6 h-6 stroke-[2.2]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wide text-white leading-none">
                SPECS <span className="text-emerald-400">BUDDY</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
                WhatsApp Suite
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapse */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-800">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Meta API Status Badge */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">Meta Cloud API</span>
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              v20.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Official Cloud Gateway Ready</p>
        </div>
      )}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-bold shrink-0 border border-slate-700">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Admin"}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>{user?.role?.replace("_", " ") || "ADMIN"}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
