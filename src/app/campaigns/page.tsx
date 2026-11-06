"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  Send,
  Plus,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  Clock,
  CheckCircle,
  Eye,
  AlertTriangle,
  ArrowRight,
  Filter,
  Calendar,
  Layers,
} from "lucide-react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/campaigns?status=${statusFilter}` : "/api/campaigns";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setCampaigns(json.campaigns || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // Poll every 5s for running campaigns
    const interval = setInterval(() => {
      fetchCampaigns();
    }, 6000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleAction = async (campaignId: string, action: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/${action}`, { method: "POST" });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (e) {}
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-500" />
              <span>WhatsApp Campaign Manager</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Launch, schedule, monitor, and retry official Meta Cloud API template broadcasts.
            </p>
          </div>

          <Link
            href="/campaigns/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Campaign</span>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { label: "All Campaigns", value: "" },
            { label: "Running", value: "RUNNING" },
            { label: "Scheduled", value: "SCHEDULED" },
            { label: "Completed", value: "COMPLETED" },
            { label: "Paused", value: "PAUSED" },
            { label: "Draft", value: "DRAFT" },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
                statusFilter === pill.value
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Campaign Cards */}
        {loading && campaigns.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            No campaigns found. Click "Create Campaign" to launch your first broadcast!
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((camp) => {
              const deliveryRate =
                camp.sentCount > 0 ? Math.round((camp.deliveredCount / camp.sentCount) * 100) : 0;
              const readRate =
                camp.deliveredCount > 0 ? Math.round((camp.readCount / camp.deliveredCount) * 100) : 0;

              const progressPercent =
                camp.totalRecipients > 0
                  ? Math.min(100, Math.round((camp.sentCount / camp.totalRecipients) * 100))
                  : 0;

              return (
                <div
                  key={camp.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/campaigns/${camp.id}`}
                          className="font-bold text-base text-slate-900 dark:text-white hover:text-emerald-500 transition-colors"
                        >
                          {camp.name}
                        </Link>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            camp.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                              : camp.status === "RUNNING"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-300 dark:border-blue-800 animate-pulse"
                              : camp.status === "SCHEDULED"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border border-purple-300 dark:border-purple-800"
                              : camp.status === "PAUSED"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {camp.status}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          Template: <span className="font-mono text-emerald-600 dark:text-emerald-400">{camp.template?.name}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {camp.description || "Optical marketing broadcast via official WhatsApp Cloud API."}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>Group: {camp.group?.name || "All Customers"}</span>
                        </span>

                        {camp.scheduledAt && (
                          <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Scheduled: {new Date(camp.scheduledAt).toLocaleString()} ({camp.timezone})</span>
                          </span>
                        )}

                        <span>Created {new Date(camp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Middle: Metrics */}
                    <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center min-w-[320px]">
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">{camp.totalRecipients}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Recipients</div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-blue-600 dark:text-blue-400">{camp.sentCount}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Sent</div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{camp.deliveredCount}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Delivered ({deliveryRate}%)</div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-cyan-600 dark:text-cyan-400">{camp.readCount}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Read ({readRate}%)</div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      {camp.status === "DRAFT" && (
                        <button
                          onClick={() => handleAction(camp.id, "dispatch")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Send Now</span>
                        </button>
                      )}

                      {camp.status === "RUNNING" && (
                        <button
                          onClick={() => handleAction(camp.id, "pause")}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </button>
                      )}

                      {camp.status === "PAUSED" && (
                        <button
                          onClick={() => handleAction(camp.id, "resume")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                      )}

                      {camp.failedCount > 0 && (
                        <button
                          onClick={() => handleAction(camp.id, "retry-failed")}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-xs font-bold flex items-center gap-1"
                          title="Retry failed recipients"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry Failed ({camp.failedCount})</span>
                        </button>
                      )}

                      <Link
                        href={`/campaigns/${camp.id}`}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                        title="View Live Drilldown"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Live Progress Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${progressPercent}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          camp.status === "COMPLETED"
                            ? "bg-emerald-500"
                            : camp.status === "RUNNING"
                            ? "bg-blue-500 animate-pulse"
                            : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 min-w-[50px] text-right">
                      {progressPercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
