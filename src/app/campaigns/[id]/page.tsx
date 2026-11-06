"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Send,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  CheckCircle,
  Eye,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Users,
  FileText,
  ShieldAlert,
} from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        const json = await res.json();
        setCampaign(json.campaign);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(() => {
      fetchDetail();
    }, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAction = async (action: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        fetchDetail();
      }
    } catch (e) {}
  };

  if (loading && !campaign) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
          Loading campaign analytics...
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-xs text-slate-500">
          Campaign not found.
          <div className="mt-3">
            <Link href="/campaigns" className="text-emerald-500 underline font-semibold">
              Return to campaigns list
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const deliveryRate =
    campaign.sentCount > 0 ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100) : 0;
  const readRate =
    campaign.deliveredCount > 0 ? Math.round((campaign.readCount / campaign.deliveredCount) * 100) : 0;

  const progressPercent =
    campaign.totalRecipients > 0
      ? Math.min(100, Math.round((campaign.sentCount / campaign.totalRecipients) * 100))
      : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/campaigns" className="text-xs text-slate-500 hover:text-emerald-500 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Campaigns</span>
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Live Progress</span>
            </div>

            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {campaign.name}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  campaign.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                    : campaign.status === "RUNNING"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-300 dark:border-blue-800 animate-pulse"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {campaign.status}
              </span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {campaign.status === "DRAFT" && (
              <button
                onClick={() => handleAction("dispatch")}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Dispatch Campaign Now</span>
              </button>
            )}

            {campaign.status === "RUNNING" && (
              <button
                onClick={() => handleAction("pause")}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}

            {campaign.status === "PAUSED" && (
              <button
                onClick={() => handleAction("resume")}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Campaign</span>
              </button>
            )}

            {campaign.failedCount > 0 && (
              <button
                onClick={() => handleAction("retry-failed")}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Failed ({campaign.failedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Audience</span>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{campaign.totalRecipients}</div>
            <div className="text-[10px] text-slate-500 mt-1">Target Group: {campaign.group?.name}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Messages Sent</span>
            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">{campaign.sentCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">{progressPercent}% audience reached</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Delivered</span>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{campaign.deliveredCount}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {deliveryRate}% Delivery Rate
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Read by Customer</span>
            <div className="mt-2 text-2xl font-black text-cyan-600 dark:text-cyan-400">{campaign.readCount}</div>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mt-1">
              {readRate}% Read Rate
            </div>
          </div>
        </div>

        {/* Live Progress Bar Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Live Dispatch Throughput</span>
            <span>{campaign.sentCount} / {campaign.totalRecipients} sent ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                campaign.status === "COMPLETED"
                  ? "bg-emerald-500"
                  : campaign.status === "RUNNING"
                  ? "bg-blue-500 animate-pulse"
                  : "bg-slate-400"
              }`}
            />
          </div>
        </div>

        {/* Recipient Drilldown Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Recipient Logs & Webhook Confirmations</span>
            </h3>
            <span className="text-xs text-slate-500">
              Showing recent {campaign.recipients?.length || 0} recipients
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">WhatsApp Phone</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Meta Message ID</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4">Delivery / Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaign.recipients?.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {rec.customerName}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {rec.phone}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === "READ"
                            ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400"
                            : rec.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                            : rec.status === "SENT"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                            : rec.status === "SUPPRESSED_OPT_OUT"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300"
                            : rec.status === "FAILED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {rec.metaMessageId || "Pending dispatch"}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {rec.sentAt ? new Date(rec.sentAt).toLocaleTimeString() : "—"}
                    </td>

                    <td className="py-3 px-4">
                      {rec.status === "SUPPRESSED_OPT_OUT" ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Suppressed: Customer opted out
                        </span>
                      ) : rec.status === "FAILED" ? (
                        <div className="text-rose-600 dark:text-rose-400 font-semibold">
                          {rec.errorCode}: {rec.errorMessage}
                        </div>
                      ) : rec.readAt ? (
                        <span className="text-cyan-600 dark:text-cyan-400">
                          Read at {new Date(rec.readAt).toLocaleTimeString()}
                        </span>
                      ) : rec.deliveredAt ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Delivered at {new Date(rec.deliveredAt).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">In transit</span>
                      )}
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
