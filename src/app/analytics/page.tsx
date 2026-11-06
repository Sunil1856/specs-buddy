"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  BarChart3,
  Download,
  Filter,
  TrendingUp,
  CheckCheck,
  Eye,
  AlertTriangle,
  Send,
  Calendar,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const summary = data?.summary || {};
  const campaigns = data?.campaigns || [];
  const errorBreakdown = data?.errorBreakdown || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <span>Performance Analytics & Delivery Reports</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive WhatsApp Cloud API campaign delivery, open ratios, and error audits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>

            <a
              href={`/api/analytics?range=${range}&export=csv`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </a>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Dispatches</div>
            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
              {summary.totalSent?.toLocaleString() || 0}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Across {summary.totalCampaigns || 0} campaigns</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Delivered Messages</div>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.totalDelivered?.toLocaleString() || 0}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {summary.avgDeliveryRate || 0}% Average Delivery
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Read Messages</div>
            <div className="mt-2 text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {summary.totalRead?.toLocaleString() || 0}
            </div>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mt-1">
              {summary.avgReadRate || 0}% Read Ratio
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Failed / Bounced</div>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
              {summary.totalFailed || 0}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Logged by Meta Webhooks</div>
          </div>
        </div>

        {/* Funnel & Error Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              WhatsApp Conversion & Delivery Funnel
            </h3>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Sent (Dispatched)</span>
                  <span>{summary.totalSent || 0} (100%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-full rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Delivered to Handset</span>
                  <span>{summary.totalDelivered || 0} ({summary.avgDeliveryRate || 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${summary.avgDeliveryRate || 0}%` }}
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Read by Customer (Blue Ticks)</span>
                  <span>{summary.totalRead || 0} ({summary.avgReadRate || 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${summary.avgReadRate || 0}%` }}
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meta API Error Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Meta WhatsApp API Error Codes Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Categorized error reasons returned by official Meta webhook events.
            </p>

            <div className="space-y-2 pt-2">
              {errorBreakdown.map((err: any) => (
                <div
                  key={err.code}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {err.code}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{err.description}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{err.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Campaign-by-Campaign Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Campaign Performance Comparison Table
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Sent</th>
                  <th className="py-3 px-4">Delivered (%)</th>
                  <th className="py-3 px-4">Read (%)</th>
                  <th className="py-3 px-4">Failed</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaigns.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {c.templateName}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {c.totalRecipients} ({c.groupName})
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                      {c.sentCount}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {c.deliveredCount} ({c.deliveryRate}%)
                    </td>
                    <td className="py-3 px-4 font-semibold text-cyan-600 dark:text-cyan-400">
                      {c.readCount} ({c.readRate}%)
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-500">
                      {c.failedCount}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {c.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
