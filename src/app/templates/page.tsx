"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  FileText,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  PhoneCall,
  Smartphone,
  Eye,
  AlertTriangle,
} from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Create Template Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "MARKETING",
    language: "en_US",
    headerType: "NONE",
    headerContent: "",
    bodyText: "",
    footerText: "SPECS BUDDY Eyewear Suite",
    buttonType: "QUICK_REPLY",
    buttonText: "Claim Offer",
    buttonUrl: "",
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const url = selectedCategory ? `/api/templates?category=${selectedCategory}` : "/api/templates";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.templates || []);
        if (json.templates?.length > 0 && !previewTemplate) {
          setPreviewTemplate(json.templates[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const handleSyncFromMeta = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/templates/sync", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        alert(`Successfully synced ${json.count} templates from Meta WhatsApp Business Account`);
        fetchTemplates();
      } else {
        alert(json.error || "Sync failed");
      }
    } catch (e: any) {
      alert(e.message || "Failed to sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const buttons = [];
      if (formData.buttonText) {
        if (formData.buttonType === "URL") {
          buttons.push({ type: "URL", text: formData.buttonText, url: formData.buttonUrl });
        } else {
          buttons.push({ type: "QUICK_REPLY", text: formData.buttonText });
        }
      }

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          language: formData.language,
          headerType: formData.headerType,
          headerContent: formData.headerContent || undefined,
          bodyText: formData.bodyText,
          footerText: formData.footerText,
          buttons,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setShowAddModal(false);
      fetchTemplates();
    } catch (err: any) {
      alert(err.message || "Failed to submit template to Meta");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Sync */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              <span>Message Template Manager</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official Meta-approved WhatsApp templates for Marketing, Utility, and Authentication.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              disabled={syncing}
              onClick={handleSyncFromMeta}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-500 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync from Meta"}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Submit New Template</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2">
          {["", "MARKETING", "UTILITY", "AUTHENTICATION"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {cat || "All Categories"}
            </button>
          ))}
        </div>

        {/* Templates Grid with Live Preview Sidecar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="py-20 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                No templates found. Click "Submit New Template" or "Sync from Meta".
              </div>
            ) : (
              templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setPreviewTemplate(tpl)}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
                    previewTemplate?.id === tpl.id
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {tpl.name}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        tpl.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                          : tpl.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400"
                      }`}
                    >
                      {tpl.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {tpl.category}
                    </span>
                    <span>•</span>
                    <span>Language: {tpl.language}</span>
                    <span>•</span>
                    <span>Header: {tpl.headerType}</span>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {tpl.bodyText}
                  </p>

                  {tpl.rejectionReason && (
                    <div className="mt-2 text-[11px] text-rose-500 font-medium">
                      Rejection Reason: {tpl.rejectionReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right: Phone Preview of selected template */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="sticky top-24 w-full max-w-[340px]">
              <div className="text-center mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Selected Template Preview
                </span>
              </div>

              {previewTemplate ? (
                <div className="relative rounded-[36px] bg-slate-900 border-[8px] border-slate-800 shadow-2xl overflow-hidden aspect-[9/18] flex flex-col">
                  {/* Top Bar */}
                  <div className="bg-[#075E54] text-white pt-7 pb-2.5 px-3 flex items-center gap-2.5 shadow z-10">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-bold text-xs">
                      SB
                    </div>
                    <div>
                      <div className="font-bold text-xs">SPECS BUDDY Verified</div>
                      <div className="text-[10px] text-emerald-200">Official WhatsApp Business</div>
                    </div>
                  </div>

                  {/* Bubble */}
                  <div className="flex-1 p-3 whatsapp-chat-bg overflow-y-auto flex flex-col justify-end">
                    <div className="max-w-[90%] ml-auto bg-[#E7FFDB] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-2xl rounded-tr-xs p-3 shadow-md border border-emerald-200/50 dark:border-emerald-800/50 space-y-2">
                      {previewTemplate.headerType === "IMAGE" && (
                        <div className="rounded-xl overflow-hidden bg-slate-200 aspect-[16/9]">
                          <img
                            src={previewTemplate.headerContent || "https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=800&auto=format&fit=crop&q=80"}
                            alt="Header"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {previewTemplate.headerType === "TEXT" && (
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {previewTemplate.headerContent}
                        </div>
                      )}

                      <p className="text-xs whitespace-pre-line leading-relaxed">
                        {previewTemplate.bodyText.replace(/\{\{1\}\}/g, "Aarav").replace(/\{\{2\}\}/g, "Mumbai")}
                      </p>

                      {previewTemplate.footerText && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-emerald-200/40 dark:border-emerald-800/40 pt-1">
                          {previewTemplate.footerText}
                        </div>
                      )}

                      <div className="text-right text-[9px] text-slate-400">
                        10:45 AM • ✓✓
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F0F2F5] dark:bg-[#1f2c34] p-2 flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-full px-3 py-1 text-[11px] text-slate-400">
                      Message...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Select a template to view the live preview.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Submit New Template */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Submit WhatsApp Template to Meta
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleCreateTemplate} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Template Identifier (Lowercase & underscores only) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. specs_buddy_summer_sale"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="MARKETING">MARKETING</option>
                      <option value="UTILITY">UTILITY</option>
                      <option value="AUTHENTICATION">AUTHENTICATION</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Header Type
                    </label>
                    <select
                      value={formData.headerType}
                      onChange={(e) => setFormData({ ...formData, headerType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="NONE">None</option>
                      <option value="TEXT">Text Header</option>
                      <option value="IMAGE">Image Header</option>
                      <option value="DOCUMENT">Document / PDF</option>
                    </select>
                  </div>
                </div>

                {formData.headerType !== "NONE" && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Header Content / Sample Media URL
                    </label>
                    <input
                      type="text"
                      value={formData.headerContent}
                      onChange={(e) => setFormData({ ...formData, headerContent: e.target.value })}
                      placeholder={formData.headerType === "TEXT" ? "👓 Free Eye Test" : "https://..."}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Body Text (Use {"{{1}}"}, {"{{2}}"} for placeholders) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.bodyText}
                    onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                    placeholder="Hello {{1}}, welcome to SPECS BUDDY! Claim 20% off on all glasses in {{2}}. Reply STOP to unsubscribe."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={formData.footerText}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Submit to Meta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
