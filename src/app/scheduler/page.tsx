"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Play,
  Pause,
  XCircle,
  Plus,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function SchedulerPage() {
  const [scheduledCampaigns, setScheduledCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const json = await res.json();
        // Filter campaigns that have a scheduled date or are pending
        const list = (json.campaigns || []).filter(
          (c: any) => c.status === "SCHEDULED" || c.status === "RUNNING" || c.scheduledAt
        );
        setScheduledCampaigns(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const handleAction = async (campaignId: string, action: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/${action}`, { method: "POST" });
      if (res.ok) {
        fetchScheduled();
      }
    } catch (e) {}
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-500" />
              <span>Persistent Campaign Scheduler & Timeline</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Scheduled background queue powered by BullMQ & persistent database scheduler.
            </p>
          </div>

          <Link
            href="/campaigns/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule New Campaign</span>
          </Link>
        </div>

        {/* Scheduler Status Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="font-bold text-white">Background Scheduler Active</div>
              <div className="text-[11px] text-slate-400">
                Polling persistent queue every 10 seconds. Timezone synced with Asia/Kolkata (IST).
              </div>
            </div>
          </div>
          <div className="px-3 py-1 rounded-lg bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700/50">
            Persistent Queue: READY
          </div>
        </div>

        {/* Scheduled Timeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
            Scheduled & Upcoming Executions
          </h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading scheduled queue...
            </div>
          ) : scheduledCampaigns.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No pending scheduled campaigns in queue. Create one via the campaign wizard.
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {camp.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            camp.status === "SCHEDULED"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              : camp.status === "RUNNING"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {camp.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5">
                        Target: <span className="font-semibold">{camp.group?.name}</span> ({camp.totalRecipients} recipients) • Template: <span className="font-mono">{camp.template?.name}</span>
                      </div>

                      <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>
                          {camp.scheduledAt
                            ? new Date(camp.scheduledAt).toLocaleString()
                            : "Immediate Dispatch"} ({camp.timezone})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {camp.status === "SCHEDULED" && (
                      <button
                        onClick={() => handleAction(camp.id, "dispatch")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Trigger Now</span>
                      </button>
                    )}

                    {camp.status === "SCHEDULED" && (
                      <button
                        onClick={() => handleAction(camp.id, "cancel")}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    )}

                    <Link
                      href={`/campaigns/${camp.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
