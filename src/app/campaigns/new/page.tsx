"use client";

import React, { useEffect, useState, Suspense } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Users,
  FileText,
  Variable,
  Image as ImageIcon,
  Smartphone,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  PhoneCall,
  ExternalLink,
  Info,
} from "lucide-react";

function NewCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedGroupId = searchParams.get("groupId");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Available Data
  const [groups, setGroups] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Wizard Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState(preselectedGroupId || "");
  const [templateId, setTemplateId] = useState("");
  const [headerUrl, setHeaderUrl] = useState("");
  const [var1, setVar1] = useState("name"); // mapping for {{1}}
  const [var2, setVar2] = useState("city"); // mapping for {{2}}
  const [customVar1, setCustomVar1] = useState("");
  const [customVar2, setCustomVar2] = useState("");

  // Test Message State
  const [testPhone, setTestPhone] = useState("+91");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Dispatch Mode
  const [sendImmediately, setSendImmediately] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [gatewayMode, setGatewayMode] = useState("META_CLOUD_API");

  useEffect(() => {
    async function initData() {
      try {
        const [groupsRes, templatesRes, gwRes] = await Promise.all([
          fetch("/api/groups"),
          fetch("/api/templates?status=APPROVED"),
          fetch("/api/whatsapp-web/qr"),
        ]);

        if (groupsRes.ok) {
          const gData = await groupsRes.json();
          setGroups(gData.groups || []);
          if (!groupId && gData.groups?.length > 0) {
            setGroupId(gData.groups[0].id);
          }
        }

        if (templatesRes.ok) {
          const tData = await templatesRes.json();
          setTemplates(tData.templates || []);
          if (tData.templates?.length > 0) {
            setTemplateId(tData.templates[0].id);
          }
        }

        if (gwRes.ok) {
          const gwData = await gwRes.json();
          if (gwData.session?.gatewayMode) {
            setGatewayMode(gwData.session.gatewayMode);
          }
        }
      } catch (e) {}
    }
    initData();
  }, []);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const selectedGroup = groups.find((g) => g.id === groupId);

  // Parse sample variables
  let sampleVars: string[] = ["John Doe", "Mumbai"];
  try {
    if (selectedTemplate?.variableSample) {
      sampleVars = JSON.parse(selectedTemplate.variableSample);
    }
  } catch (e) {}

  // Parse buttons
  let templateButtons: any[] = [];
  try {
    if (selectedTemplate?.buttons) {
      templateButtons = JSON.parse(selectedTemplate.buttons);
    }
  } catch (e) {}

  // Computed preview text with variables replaced
  const previewBody = () => {
    if (!selectedTemplate) return "Select a template to preview";
    let text = selectedTemplate.bodyText;
    const v1 = var1 === "custom" ? customVar1 || "Customer" : "Aarav Mehta";
    const v2 = var2 === "custom" ? customVar2 || "Mumbai" : "Mumbai Store";
    text = text.replace(/\{\{1\}\}/g, v1);
    text = text.replace(/\{\{2\}\}/g, v2);
    return text;
  };

  // Send Single Test Preview Message
  const handleSendTestMessage = async () => {
    if (!testPhone || testPhone.length < 10) {
      alert("Please enter a valid phone number (e.g. +919820011221)");
      return;
    }

    setTestSending(true);
    setTestResult(null);

    try {
      const v1 = var1 === "custom" ? customVar1 || "Valued Customer" : "Aarav Mehta";
      const v2 = var2 === "custom" ? customVar2 || "Mumbai" : "Mumbai Store";

      const res = await fetch("/api/campaigns/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testPhone,
          templateId,
          headerUrl: headerUrl || selectedTemplate?.headerContent,
          bodyVariables: [v1, v2],
        }),
      });

      const json = await res.json();
      setTestResult(json);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTestSending(false);
    }
  };

  // Submit and Launch/Schedule Campaign
  const handleSubmitCampaign = async () => {
    if (!name.trim()) {
      alert("Please provide a campaign name");
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      const variableMappings = {
        "1": var1 === "custom" ? customVar1 : var1,
        "2": var2 === "custom" ? customVar2 : var2,
      };

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          groupId,
          templateId,
          mediaHeaderUrl: headerUrl || selectedTemplate?.headerContent || undefined,
          variableMappings,
          scheduledAt: sendImmediately ? null : scheduledAt,
          timezone,
          sendImmediately,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      router.push(`/campaigns/${json.campaign.id}`);
    } catch (e: any) {
      alert(e.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>Bulk Campaign Launch Wizard</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Follow Meta-compliant steps to construct, preview, and dispatch WhatsApp campaigns.
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Campaigns</span>
          </button>
        </div>

        {/* Wizard Steps Stepper */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {[
            { num: 1, label: "Audience & Details" },
            { num: 2, label: "Template & Media" },
            { num: 3, label: "Variables & Preview" },
            { num: 4, label: "Test & Schedule" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`p-3 rounded-xl border text-left transition-all ${
                step === s.num
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500 shadow-sm"
                  : step > s.num
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">
                  {s.num}
                </span>
                <span>{s.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Wizard Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Configuration Steps */}
          <div className="lg:col-span-7 space-y-5">
            {/* STEP 1: Audience & Details */}
            {step === 1 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>Step 1: Campaign Details & Target Group</span>
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Diwali Optical Flash Sale 2026"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campaign Description (Internal Purpose)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Broadcast to VIP eyewear clients with 20% discount coupon"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Target Customer Group *
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 text-xs"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.totalMembers} Total • {g.optedInMembers} Subscribed)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audience Opt-Out Suppression Notice */}
                {selectedGroup && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Audience Suppression Summary:</span>
                      <span className="text-emerald-500 font-extrabold">{selectedGroup.optedInMembers} Eligible</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Total Group Contacts:</span>
                      <span>{selectedGroup.totalMembers}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-500 text-[11px] font-semibold">
                      <span>Suppressed (Opted Out / STOP):</span>
                      <span>{selectedGroup.optedOutMembers} (Will NOT be sent)</span>
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!name.trim()) return alert("Please enter campaign name");
                      setStep(2);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                  >
                    <span>Proceed to Template</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Template & Media Header */}
            {step === 2 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Step 2: Choose Approved Meta WhatsApp Template</span>
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meta Approved Template *
                  </label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 font-mono text-xs"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.category} • {tpl.language})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">Template Details:</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        {selectedTemplate.status}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                      <div>Category: <span className="font-semibold text-slate-900 dark:text-white">{selectedTemplate.category}</span></div>
                      <div>Language: <span className="font-semibold text-slate-900 dark:text-white">{selectedTemplate.language}</span></div>
                      <div>Header Format: <span className="font-semibold text-slate-900 dark:text-white">{selectedTemplate.headerType}</span></div>
                    </div>
                  </div>
                )}

                {/* Media Header URL */}
                {selectedTemplate?.headerType && selectedTemplate.headerType !== "NONE" && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Header {selectedTemplate.headerType} URL *</span>
                      <span className="text-slate-400 text-[10px]">Meta supported public URL</span>
                    </label>
                    <input
                      type="url"
                      value={headerUrl}
                      onChange={(e) => setHeaderUrl(e.target.value)}
                      placeholder={selectedTemplate.headerContent || "https://images.unsplash.com/photo-..."}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 text-xs"
                    />
                  </div>
                )}

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                  >
                    <span>Proceed to Variables</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Dynamic Variables & Mapping */}
            {step === 3 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Variable className="w-4 h-4 text-emerald-500" />
                  <span>Step 3: Dynamic Customer Variable Mapping</span>
                </h3>

                <p className="text-slate-500 text-xs">
                  Map placeholders in the Meta approved template to recipient profile attributes.
                </p>

                {/* Variable 1 */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block font-bold text-slate-900 dark:text-white">
                    Variable {"{{1}}"} (Sample: {sampleVars[0] || "Name"})
                  </label>
                  <select
                    value={var1}
                    onChange={(e) => setVar1(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="name">Customer Full Name (e.g. Aarav Mehta)</option>
                    <option value="city">Customer City (e.g. Mumbai)</option>
                    <option value="phone">Customer Phone Number</option>
                    <option value="custom">Custom Static Text</option>
                  </select>
                  {var1 === "custom" && (
                    <input
                      type="text"
                      placeholder="Enter custom static text for {{1}}"
                      value={customVar1}
                      onChange={(e) => setCustomVar1(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  )}
                </div>

                {/* Variable 2 */}
                {selectedTemplate?.bodyText.includes("{{2}}") && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="block font-bold text-slate-900 dark:text-white">
                      Variable {"{{2}}"} (Sample: {sampleVars[1] || "City/Offer"})
                    </label>
                    <select
                      value={var2}
                      onChange={(e) => setVar2(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <option value="city">Customer City (e.g. Mumbai)</option>
                      <option value="name">Customer Full Name</option>
                      <option value="custom">Custom Static Text</option>
                    </select>
                    {var2 === "custom" && (
                      <input
                        type="text"
                        placeholder="Enter custom static text for {{2}}"
                        value={customVar2}
                        onChange={(e) => setCustomVar2(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    )}
                  </div>
                )}

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                  >
                    <span>Proceed to Test & Send</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Test Message & Dispatch / Scheduler */}
            {step === 4 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Step 4: Dispatch Controls & Single Test Send</span>
                </h3>

                {/* Active Gateway Mode Indicator */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Active Dispatch Gateway:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {gatewayMode === "WHATSAPP_WEB" ? "WhatsApp Web Linked Device" : "Official Meta WhatsApp Cloud API"}
                    </span>
                  </div>
                  <Link
                    href="/settings"
                    className="text-teal-600 dark:text-teal-400 font-semibold hover:underline text-[11px] self-end sm:self-auto"
                  >
                    Switch Gateway in Settings →
                  </Link>
                </div>

                {/* Test Send Box */}
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>Send a Real Test Preview Before Dispatching</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Verify the actual formatting on your own mobile WhatsApp number.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+919820011221"
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    />
                    <button
                      type="button"
                      disabled={testSending}
                      onClick={handleSendTestMessage}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 text-white font-bold disabled:opacity-50 whitespace-nowrap"
                    >
                      {testSending ? "Sending Test..." : "Send Test"}
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-2.5 rounded-lg text-[11px] font-medium border ${
                        testResult.success
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-400"
                      }`}
                    >
                      {testResult.success
                        ? `✅ Test message delivered! ID: ${testResult.messageId} ${testResult.isSimulated ? "(Test Mode)" : ""}`
                        : `❌ Error sending test: ${testResult.error}`}
                    </div>
                  )}
                </div>

                {/* Dispatch Scheduling Options */}
                <div className="space-y-3 pt-2">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Campaign Dispatch Schedule:
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setSendImmediately(true)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-colors ${
                        sendImmediately
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={sendImmediately}
                        onChange={() => setSendImmediately(true)}
                      />
                      <div>
                        <div className="font-bold text-xs">Send Immediately</div>
                        <div className="text-[10px] text-slate-500">Queue & start dispatch now</div>
                      </div>
                    </label>

                    <label
                      onClick={() => setSendImmediately(false)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-colors ${
                        !sendImmediately
                          ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-800 dark:text-purple-300"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={!sendImmediately}
                        onChange={() => setSendImmediately(false)}
                      />
                      <div>
                        <div className="font-bold text-xs">Schedule for Later</div>
                        <div className="text-[10px] text-slate-500">Auto-execute on date/time</div>
                      </div>
                    </label>
                  </div>

                  {!sendImmediately && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Date & Time *
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Timezone
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                          <option value="UTC">UTC (GMT)</option>
                          <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmitCampaign}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{sendImmediately ? "Launch Broadcast Now" : "Confirm Campaign Schedule"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Interactive WhatsApp Phone Mockup Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="sticky top-24 w-full max-w-[340px]">
              <div className="text-center mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Live Interactive WhatsApp Screen
                </span>
              </div>

              {/* Phone Frame */}
              <div className="relative rounded-[36px] bg-slate-900 border-[8px] border-slate-800 shadow-2xl overflow-hidden aspect-[9/18] flex flex-col">
                {/* Phone Speaker Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                </div>

                {/* WhatsApp Chat App Header */}
                <div className="bg-[#075E54] text-white pt-7 pb-2.5 px-3 flex items-center gap-2.5 shadow z-10">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-bold text-xs">
                    SB
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate flex items-center gap-1">
                      <span>SPECS BUDDY Official</span>
                      <CheckCircle className="w-3 h-3 text-emerald-300 inline fill-emerald-300 text-[#075E54]" />
                    </div>
                    <div className="text-[10px] text-emerald-200">Official Business Account</div>
                  </div>
                </div>

                {/* WhatsApp Chat Canvas */}
                <div className="flex-1 p-3 whatsapp-chat-bg overflow-y-auto flex flex-col justify-end">
                  {/* Encrypted Notice */}
                  <div className="mx-auto mb-3 px-3 py-1 bg-amber-100/90 dark:bg-slate-800/90 text-[10px] text-amber-900 dark:text-amber-200 text-center rounded-lg shadow-sm">
                    🔒 Messages are end-to-end encrypted.
                  </div>

                  {/* Outbound Template Message Bubble */}
                  <div className="max-w-[90%] ml-auto bg-[#E7FFDB] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-2xl rounded-tr-xs p-3 shadow-md border border-emerald-200/50 dark:border-emerald-800/50 space-y-2">
                    {/* Header Image if supported */}
                    {selectedTemplate?.headerType === "IMAGE" && (
                      <div className="rounded-xl overflow-hidden bg-slate-200 aspect-[16/9]">
                        <img
                          src={headerUrl || selectedTemplate.headerContent || "https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=800&auto=format&fit=crop&q=80"}
                          alt="Header Preview"
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80";
                          }}
                        />
                      </div>
                    )}

                    {/* Header Text */}
                    {selectedTemplate?.headerType === "TEXT" && (
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {selectedTemplate.headerContent || "👓 SPECS BUDDY Special"}
                      </div>
                    )}

                    {/* Message Body with dynamic variable interpolation */}
                    <p className="text-xs whitespace-pre-line leading-relaxed">
                      {previewBody()}
                    </p>

                    {/* Footer Text */}
                    {selectedTemplate?.footerText && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-emerald-200/40 dark:border-emerald-800/40 pt-1">
                        {selectedTemplate.footerText}
                      </div>
                    )}

                    {/* Time & Read Receipts */}
                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span>10:45 AM</span>
                      <span className="text-cyan-500 font-bold">✓✓</span>
                    </div>

                    {/* Quick Reply / CTA Buttons */}
                    {templateButtons.length > 0 && (
                      <div className="pt-2 border-t border-emerald-200/40 dark:border-emerald-800/40 space-y-1.5">
                        {templateButtons.map((btn: any, idx: number) => (
                          <div
                            key={idx}
                            className="w-full py-1 px-2 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-slate-900/60 rounded-lg flex items-center justify-center gap-1 shadow-sm"
                          >
                            {btn.type === "URL" && <ExternalLink className="w-3 h-3" />}
                            {btn.type === "CALL_PHONE" && <PhoneCall className="w-3 h-3" />}
                            <span>{btn.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* WhatsApp Chat Input Bar Footer */}
                <div className="bg-[#F0F2F5] dark:bg-[#1f2c34] p-2 flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-slate-800 rounded-full px-3 py-1.5 text-[11px] text-slate-400">
                    Reply or message...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center text-xs">
                    🎤
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            Loading Campaign Wizard...
          </div>
        </AppLayout>
      }
    >
      <NewCampaignForm />
    </Suspense>
  );
}
