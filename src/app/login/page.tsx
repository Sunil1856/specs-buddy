"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Glasses, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.token, data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B132B] via-[#0F172A] to-[#1C2541] p-4 text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/30 mb-4 text-white">
            <Glasses className="w-9 h-9 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black tracking-wide text-white">
            SPECS <span className="text-emerald-400">BUDDY</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            WhatsApp Marketing & CRM Portal
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-2">Sign In to Dashboard</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter your credentials to manage campaigns, audiences, and templates.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@specsbuddy.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Quick Role Login (Preloaded Demo)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickFill("admin@specsbuddy.com", "SpecsBuddy@2026")}
                className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-colors"
              >
                <div className="font-semibold text-emerald-400">Super Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@specsbuddy.com</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill("manager@specsbuddy.com", "Manager@2026")}
                className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-colors"
              >
                <div className="font-semibold text-teal-400">Marketing Lead</div>
                <div className="text-[10px] text-slate-400 truncate">manager@specsbuddy.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Feature Pillars */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-[11px] text-slate-400">
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Official Meta API</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Opt-Out Suppression</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>24h Window Guard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
