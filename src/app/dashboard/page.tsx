"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  Megaphone,
  Send,
  CheckCheck,
  Eye,
  AlertTriangle,
  TrendingUp,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Sparkles,
  Glasses,
  Key,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-slate-500">Aggregating live WhatsApp statistics...</p>
        </div>
      </AppLayout>
    );
  }

  const metrics = data?.metrics || {};
  const apiStatus = data?.apiStatus || {};
  const recentCampaigns = data?.recentCampaigns || [];
  const recentActivity = data?.recentActivity || [];
  const trends = data?.trends || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome & API Status Bar */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#0F172A] to-[#162238] border border-slate-800 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Glasses className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-wide text-white">
                  SPECS BUDDY Command Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Live DB & Webhooks
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time WhatsApp Cloud API marketing throughput, suppression metrics, and customer engagement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">API Tier & Limit</div>
              <div className="text-emerald-400 font-bold">{apiStatus.messagingLimit?.replace("TIER_", "Tier ") || "Tier 1 (1k/day)"}</div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Quality Rating</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {apiStatus.qualityRating || "GREEN"}
              </div>
            </div>

            <Link
              href="/campaigns/new"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Campaign</span>
            </Link>
          </div>
        </div>

        {/* 8 KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Contacts */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Contacts
              </span>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalContacts?.toLocaleString() || 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {metrics.totalSubscribedContacts || 0} Subscribed
              </span>
              <span>•</span>
              <span className="text-rose-500">{metrics.totalOptedOut || 0} Opted-Out</span>
            </div>
          </div>

          {/* Total Campaigns */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Campaigns
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalCampaigns || 0}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {metrics.activeCampaigns || 0} active / scheduled
            </div>
          </div>

          {/* Messages Sent */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Messages Sent
              </span>
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              {metrics.messagesSent?.toLocaleString() || 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Dispatched via Meta Graph API
            </div>
          </div>

          {/* Messages Delivered */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Delivered
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              {metrics.messagesDelivered?.toLocaleString() || 0}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {metrics.deliveryRate || 100}% Delivery Rate
            </div>
          </div>

          {/* Messages Read */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Messages Read
              </span>
              <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              {metrics.messagesRead?.toLocaleString() || 0}
            </div>
            <div className="mt-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
              {metrics.readRate || 0}% Read Ratio
            </div>
          </div>

          {/* Failed Messages */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Failed Messages
              </span>
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              {metrics.messagesFailed || 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {metrics.messagesFailed > 0 ? "Inspect in error reports" : "0 API delivery errors"}
            </div>
          </div>

          {/* Campaign Success Rate */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Success Rate
              </span>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              {metrics.campaignSuccessRate || 100}%
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Verified by Webhooks
            </div>
          </div>

          {/* WhatsApp API Connection */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                API Connection
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              {apiStatus.connected ? "Operational" : "Connected"}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {apiStatus.isTestMode ? "Test Simulation Mode" : "Production Gateway"}
            </div>
          </div>
        </div>

        {/* Charts & Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Graph Card */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  7-Day WhatsApp Delivery Performance
                </h3>
                <p className="text-xs text-slate-500">
                  Actual volume of Sent, Delivered, and Read messages across campaigns
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Sent
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Delivered
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> Read
                </span>
              </div>
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="h-64 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
              {trends.map((item: any, idx: number) => {
                const maxVal = Math.max(...trends.map((t: any) => t.sent || 1), 10);
                const sentH = Math.max(15, Math.round((item.sent / maxVal) * 180));
                const delivH = Math.max(12, Math.round((item.delivered / maxVal) * 180));
                const readH = Math.max(8, Math.round((item.read / maxVal) * 180));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1">
                      <div
                        style={{ height: `${sentH}px` }}
                        className="w-2.5 sm:w-3.5 bg-blue-500/80 hover:bg-blue-600 rounded-t transition-all"
                        title={`Sent: ${item.sent}`}
                      />
                      <div
                        style={{ height: `${delivH}px` }}
                        className="w-2.5 sm:w-3.5 bg-emerald-500/90 hover:bg-emerald-600 rounded-t transition-all"
                        title={`Delivered: ${item.delivered}`}
                      />
                      <div
                        style={{ height: `${readH}px` }}
                        className="w-2.5 sm:w-3.5 bg-cyan-400 hover:bg-cyan-500 rounded-t transition-all"
                        title={`Read: ${item.read}`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2 truncate">
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Syncing with Meta Webhooks in real-time</span>
              <Link href="/analytics" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">
                View Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Actions & Live Inbox Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                Operational Shortcuts
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Rapid workflows for optical marketing campaigns
              </p>

              <div className="space-y-2.5">
                <Link
                  href="/settings?tab=api"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/80 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Meta Cloud API Setup</div>
                      <div className="text-[11px] text-slate-500">Configure credentials & test live connection</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </Link>

                <Link
                  href="/campaigns/new"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/80 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Broadcast Campaign</div>
                      <div className="text-[11px] text-slate-500">Filter group and send Meta template</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </Link>

                <Link
                  href="/contacts?action=import"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/80 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Import Eyewear Customers</div>
                      <div className="text-[11px] text-slate-500">CSV or Excel with duplicate detection</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </Link>

                <Link
                  href="/inbox"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700/80 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Live Customer Inbox</div>
                      <div className="text-[11px] text-slate-500">Enforces 24-hr customer service window</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                </Link>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">Opt-Out Protection:</span> Automatically suppresses contacts who replied STOP or unsubscribed from all active dispatches.
            </div>
          </div>
        </div>

        {/* Recent Campaigns Table & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns Table */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Recent Campaign Activity
              </h3>
              <Link href="/campaigns" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                View All Campaigns
              </Link>
            </div>

            {recentCampaigns.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No campaigns launched yet. Click "Launch Campaign" to start.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-lg">Campaign Name</th>
                      <th className="py-2.5 px-3">Target Group</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Audience</th>
                      <th className="py-2.5 px-3">Delivered</th>
                      <th className="py-2.5 px-3 rounded-r-lg">Read</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentCampaigns.map((camp: any) => (
                      <tr key={camp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          <Link href={`/campaigns/${camp.id}`} className="hover:text-emerald-500 transition-colors">
                            {camp.name}
                          </Link>
                          <div className="text-[10px] text-slate-400">{camp.template?.name}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {camp.group?.name || "All Customers"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              camp.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                                : camp.status === "RUNNING"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-300 dark:border-blue-800 animate-pulse"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            }`}
                          >
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {camp.totalRecipients}
                        </td>
                        <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                          {camp.deliveredCount}
                        </td>
                        <td className="py-3 px-3 text-cyan-600 dark:text-cyan-400 font-bold">
                          {camp.readCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Audit Feed */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Live Activity Audit
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real system actions and webhook events
            </p>

            <div className="space-y-3">
              {recentActivity.map((log: any) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {log.action.replace(/_/g, " ")}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{log.details}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      By {log.userName || "System"} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
