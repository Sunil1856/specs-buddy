"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  QrCode,
  Smartphone,
  BatteryCharging,
  Zap,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Unlink,
  MessageSquare,
  Radio,
  Image as ImageIcon,
  Check,
  Sparkles,
  Sliders,
  CheckCheck,
} from "lucide-react";

export default function WhatsAppWebPage() {
  const [activeTab, setActiveTab] = useState<"connect" | "broadcast" | "direct" | "gateway">("connect");

  // Web Session State
  const [session, setSession] = useState<any>({
    status: "DISCONNECTED",
    qrCodeUrl: null,
    connectedPhone: null,
    pushName: null,
    battery: 94,
    platform: "WhatsApp Multi-Device Engine",
    gatewayMode: "META_CLOUD_API",
  });
  const [loadingSession, setLoadingSession] = useState(true);
  const [generatingQr, setGeneratingQr] = useState(false);

  // Quick Pair State
  const [pairingPhone, setPairingPhone] = useState("+919820011221");
  const [pairingName, setPairingName] = useState("SPECS BUDDY Store");
  const [pairingLoading, setPairingLoading] = useState(false);

  // Direct Message State
  const [directPhone, setDirectPhone] = useState("+919820011221");
  const [directMsg, setDirectMsg] = useState("Hello! Welcome to SPECS BUDDY Optical Store.");
  const [sendingDirect, setSendingDirect] = useState(false);
  const [directResult, setDirectResult] = useState<any>(null);

  // Broadcast State
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState(
    "Hi {{name}},\n\n👓 Special Eyewear Offer from SPECS BUDDY in {{city}}! Get FLAT 40% OFF on all designer optical frames & sunglasses this week.\n\nReply 'YES' to book your Free Eye Checkup!"
  );
  const [broadcastMediaUrl, setBroadcastMediaUrl] = useState(
    "https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=800"
  );
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);

  // Gateway Switching State
  const [switchingGateway, setSwitchingGateway] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/whatsapp-web/qr");
      if (res.ok) {
        const json = await res.json();
        if (json.session) setSession(json.session);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSession(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const json = await res.json();
        setGroups(json.groups || []);
        if (json.groups?.length > 0) {
          setSelectedGroupId(json.groups[0].id);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSession();
    fetchGroups();
  }, []);

  const handleGenerateQr = async () => {
    setGeneratingQr(true);
    try {
      const res = await fetch("/api/whatsapp-web/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_QR" }),
      });
      if (res.ok) {
        const json = await res.json();
        setSession((prev: any) => ({
          ...prev,
          status: "QR_READY",
          qrCodeUrl: json.qrCodeUrl,
        }));
      }
    } catch (e) {
      alert("Failed to generate QR code");
    } finally {
      setGeneratingQr(false);
    }
  };

  const handlePairDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairingLoading(true);
    try {
      const res = await fetch("/api/whatsapp-web/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAIR_DEVICE",
          phone: pairingPhone,
          pushName: pairingName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSession(json.session);
      alert("🎉 WhatsApp Web Device linked successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to link device");
    } finally {
      setPairingLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp Web session?")) return;
    try {
      const res = await fetch("/api/whatsapp-web/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISCONNECT" }),
      });
      if (res.ok) {
        const json = await res.json();
        setSession(json.session);
      }
    } catch (e) {
      alert("Failed to disconnect");
    }
  };

  const handleSwitchGateway = async (mode: "META_CLOUD_API" | "WHATSAPP_WEB") => {
    setSwitchingGateway(true);
    try {
      const res = await fetch("/api/whatsapp-web/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        setSession((prev: any) => ({ ...prev, gatewayMode: mode }));
        alert(`Active sending gateway changed to: ${mode === "WHATSAPP_WEB" ? "WhatsApp Web Linked Device" : "Official Meta Cloud API"}`);
      }
    } catch (e) {
      alert("Failed to switch gateway");
    } finally {
      setSwitchingGateway(false);
    }
  };

  const handleSendDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingDirect(true);
    setDirectResult(null);
    try {
      const res = await fetch("/api/whatsapp-web/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneList: [directPhone],
          messageText: directMsg,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDirectResult({ success: true, message: "Direct message sent successfully!" });
    } catch (err: any) {
      setDirectResult({ success: false, message: err.message || "Failed to send message" });
    } finally {
      setSendingDirect(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return alert("Please select a customer group");
    if (!broadcastMessage.trim()) return alert("Message text cannot be empty");

    setSendingBroadcast(true);
    setBroadcastResult(null);
    try {
      const res = await fetch("/api/whatsapp-web/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          messageText: broadcastMessage,
          mediaUrl: broadcastMediaUrl || undefined,
          mediaType: broadcastMediaUrl ? "image" : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setBroadcastResult(json);
    } catch (err: any) {
      alert(err.message || "Broadcast failed");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const isConnected = session.status === "CONNECTED";
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>WhatsApp Web Suite (QR Connect & Broadcast)</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isConnected
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                  }`}>
                    {session.status}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scan QR code with WhatsApp on your phone to send bulk marketing broadcasts directly with zero Meta template approvals.
                </p>
              </div>
            </div>
          </div>

          {/* Active Sending Gateway Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-500">Active Gateway:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              session.gatewayMode === "WHATSAPP_WEB"
                ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
            }`}>
              {session.gatewayMode === "WHATSAPP_WEB" ? "🟢 WhatsApp Web Linked" : "🔵 Meta Cloud API"}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("connect")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              activeTab === "connect"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>1. QR Code & Device Session</span>
            {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-300"></span>}
          </button>

          <button
            onClick={() => setActiveTab("broadcast")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              activeTab === "broadcast"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>2. Direct Web Broadcast (Zero Template Approval)</span>
          </button>

          <button
            onClick={() => setActiveTab("direct")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              activeTab === "direct"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>3. Quick Direct Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("gateway")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              activeTab === "gateway"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>4. Gateway Switcher (Meta vs Web)</span>
          </button>
        </div>

        {/* TAB 1: QR Code & Device Pairing */}
        {activeTab === "connect" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: QR Code Display / Device Card */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-500" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      WhatsApp Linked Device Status
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Multi-Device pairing keeps your session active even when phone is locked
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isConnected
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                    : session.status === "QR_READY"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {session.status}
                </span>
              </div>

              {isConnected ? (
                /* Connected State View */
                <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800/80 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-md">
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {session.connectedPhone}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Online
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {session.pushName || "SPECS BUDDY Official Store"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {session.platform || "WhatsApp Multi-Device Engine"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-teal-200/60 dark:border-teal-800/60 text-xs">
                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-teal-100 dark:border-teal-900">
                      <div className="text-[10px] text-slate-500 font-semibold">Device Battery</div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                        <BatteryCharging className="w-4 h-4 text-emerald-500" />
                        <span>{session.battery || 94}%</span>
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-teal-100 dark:border-teal-900">
                      <div className="text-[10px] text-slate-500 font-semibold">Gateway Status</div>
                      <div className="font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                        {session.gatewayMode === "WHATSAPP_WEB" ? "Active Sending Gateway" : "Standby (Meta Active)"}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-teal-100 dark:border-teal-900">
                      <div className="text-[10px] text-slate-500 font-semibold">Template Approval</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        0 Approvals Needed
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-800"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect Device</span>
                    </button>

                    {session.gatewayMode !== "WHATSAPP_WEB" ? (
                      <button
                        onClick={() => handleSwitchGateway("WHATSAPP_WEB")}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Set As Default Gateway</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab("broadcast")}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Start Direct Broadcast →</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Disconnected QR Code View */
                <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 shrink-0 flex flex-col items-center">
                    {session.qrCodeUrl ? (
                      <img
                        src={session.qrCodeUrl}
                        alt="WhatsApp Web QR Code"
                        className="w-48 h-48 rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-center p-4">
                        <QrCode className="w-12 h-12 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">QR Code not generated yet</span>
                      </div>
                    )}

                    <button
                      onClick={handleGenerateQr}
                      disabled={generatingQr}
                      className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-700 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 w-full justify-center"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${generatingQr ? "animate-spin" : ""}`} />
                      <span>{generatingQr ? "Generating..." : "Generate Live QR Code"}</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                    <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                      How to Link WhatsApp Web:
                    </h5>
                    <ol className="space-y-2 list-decimal list-inside text-slate-600 dark:text-slate-400">
                      <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                      <li>Tap <strong>Menu (⋮)</strong> on Android or <strong>Settings</strong> on iPhone.</li>
                      <li>Select <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong>.</li>
                      <li>Point your phone camera at this QR code.</li>
                    </ol>
                    <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[11px]">
                      🔒 Multi-Device protocol allows sending messages even when your mobile phone has no internet connection.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Instant Link & Device Specs */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-xs space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-500" />
                  <span>Instant Link Device Form</span>
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Link your WhatsApp store number directly into SPECS BUDDY session store.
                </p>

                <form onSubmit={handlePairDevice} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Store WhatsApp Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={pairingPhone}
                      onChange={(e) => setPairingPhone(e.target.value)}
                      placeholder="+919820011221"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Store Display Name
                    </label>
                    <input
                      type="text"
                      value={pairingName}
                      onChange={(e) => setPairingName(e.target.value)}
                      placeholder="SPECS BUDDY Official Store"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pairingLoading}
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{pairingLoading ? "Linking Device..." : "Pair & Link Device Now"}</span>
                  </button>
                </form>
              </div>

              {/* Key Advantages Card */}
              <div className="bg-gradient-to-br from-slate-900 to-[#0B132B] text-white rounded-2xl p-5 shadow-sm space-y-3 text-xs">
                <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Why Use WhatsApp Web Gateway?</span>
                </h4>
                <ul className="space-y-2 text-slate-300 text-[11px]">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>No Meta Approvals:</strong> Send any promotional offers, discount codes, or event alerts immediately.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Unrestricted 24/7 Messaging:</strong> No 24-hour customer window locks in the live inbox.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Direct From Your Number:</strong> Customers see your actual store phone number and can call you back directly.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Direct WhatsApp Web Broadcast */}
        {activeTab === "broadcast" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-teal-500" />
                  <span>Launch Direct WhatsApp Web Broadcast</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Zero Template Restrictions
                </span>
              </div>

              {!isConnected && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    WhatsApp Web session is not linked yet. Please go to <strong>Tab 1 (QR Code & Device Session)</strong> to pair your phone first!
                  </span>
                </div>
              )}

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Target Customer Group *
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs text-slate-900 dark:text-white"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g._count?.members || 0} Contacts)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Broadcast Message Body (Free-Form Text) *</span>
                    <span className="text-[10px] text-slate-400">Supports &#123;&#123;name&#125;&#125;, &#123;&#123;city&#125;&#125;</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type your WhatsApp message..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white resize-y"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Quick Optical Offer Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setBroadcastMessage(
                          "Hi {{name}},\n\n👓 SPECS BUDDY Exclusive Flash Sale in {{city}}! Get FLAT 50% OFF on all prescription lenses when you buy any optical frame today.\n\nVisit our store or reply 'OFFER' to claim your voucher!"
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium"
                    >
                      50% Lens Discount
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setBroadcastMessage(
                          "Hello {{name}},\n\n🩺 Time for your annual eye checkup! Book a 100% Free Computerized Eye Examination at SPECS BUDDY this weekend.\n\nReply 'BOOK' to reserve your slot in {{city}}."
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium"
                    >
                      Free Eye Test Reminder
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setBroadcastMessage(
                          "Dear {{name}},\n\n✨ New Arrival: Premium Anti-Glare & Blue Cut Eyeglasses now in stock at SPECS BUDDY {{city}}!\n\nProtect your eyes from digital screen fatigue. Shop today!"
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium"
                    >
                      Blue Cut Glasses Launch
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Optional Header Image URL
                  </label>
                  <input
                    type="url"
                    value={broadcastMediaUrl}
                    onChange={(e) => setBroadcastMediaUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-slate-500 text-[11px]">
                    Opt-out suppression active: Users who sent "STOP" are automatically filtered out.
                  </div>

                  <button
                    type="submit"
                    disabled={sendingBroadcast || !isConnected}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Send className={`w-4 h-4 ${sendingBroadcast ? "animate-pulse" : ""}`} />
                    <span>{sendingBroadcast ? "Sending Broadcast..." : "Launch WhatsApp Web Broadcast"}</span>
                  </button>
                </div>
              </form>

              {/* Broadcast Result */}
              {broadcastResult && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Broadcast Dispatch Summary</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80">
                      <span className="text-slate-500 text-[10px]">Total Sent:</span>
                      <div className="font-bold text-emerald-600 text-sm">{broadcastResult.sentCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80">
                      <span className="text-slate-500 text-[10px]">Suppressed (Opt-Out):</span>
                      <div className="font-bold text-amber-600 text-sm">{broadcastResult.suppressedCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80">
                      <span className="text-slate-500 text-[10px]">Failed:</span>
                      <div className="font-bold text-rose-600 text-sm">{broadcastResult.failedCount}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live WhatsApp Mockup Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Live WhatsApp Message Preview
                </h4>

                <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-md">
                  {/* WhatsApp Mobile Header */}
                  <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      👓
                    </div>
                    <div>
                      <div className="font-bold text-xs">SPECS BUDDY Official Store</div>
                      <div className="text-[10px] text-teal-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Online</span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Chat Canvas */}
                  <div className="whatsapp-chat-bg p-4 min-h-[300px] flex flex-col justify-end">
                    <div className="max-w-[90%] self-end bg-[#E7FFDB] dark:bg-emerald-950/80 text-slate-900 dark:text-white rounded-2xl rounded-tr-none p-3 shadow-sm space-y-2 border border-emerald-200/50 dark:border-emerald-800/50">
                      {broadcastMediaUrl && (
                        <img
                          src={broadcastMediaUrl}
                          alt="Media Header"
                          className="w-full h-36 object-cover rounded-xl"
                        />
                      )}
                      <div className="whitespace-pre-line text-xs leading-relaxed">
                        {broadcastMessage
                          .replace(/{{name}}/gi, "Aarav Mehta")
                          .replace(/{{city}}/gi, "Mumbai")
                          .replace(/{{phone}}/gi, "+919820011221")}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>12:45 PM</span>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 text-center">
                  Preview shows how your message will appear on customer's WhatsApp screen.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Quick Direct Chat */}
        {activeTab === "direct" && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-500" />
              <span>Direct WhatsApp Message Dispatcher</span>
            </h3>
            <p className="text-slate-500 text-[11px]">
              Send an instant free-form WhatsApp message to any customer number directly through your linked phone.
            </p>

            <form onSubmit={handleSendDirect} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  required
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                  placeholder="+919820011221"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content (Free-Form Text)
                </label>
                <textarea
                  rows={4}
                  required
                  value={directMsg}
                  onChange={(e) => setDirectMsg(e.target.value)}
                  placeholder="Type message..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={sendingDirect || !isConnected}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingDirect ? "Sending..." : "Send WhatsApp Message Now"}</span>
              </button>
            </form>

            {directResult && (
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                directResult.success
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
              }`}>
                {directResult.message}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Gateway Switcher */}
        {activeTab === "gateway" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-500" />
                <span>Dual Gateway Management: Meta Cloud API vs WhatsApp Web</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Toggle between Official Meta Graph API v20.0 and WhatsApp Web Multi-Device Gateway as your default broadcast engine.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card A: Meta Cloud API */}
              <div className={`p-6 rounded-2xl border transition-all ${
                session.gatewayMode === "META_CLOUD_API"
                  ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                      Official Enterprise
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                      Meta WhatsApp Cloud API
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Direct cloud integration with Meta Business Account. Best for verified enterprise scaling.
                    </p>
                  </div>
                  {session.gatewayMode === "META_CLOUD_API" ? (
                    <span className="p-1 rounded-full bg-emerald-600 text-white">
                      <Check className="w-4 h-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchGateway("META_CLOUD_API")}
                      disabled={switchingGateway}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-700 text-xs font-semibold hover:bg-emerald-600"
                    >
                      Activate
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>High volume throughput (1,000 to 100,000 msgs/day)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Official Green Tick verification badge supported</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Requires Meta-approved templates & 24h conversation window</span>
                  </div>
                </div>
              </div>

              {/* Card B: WhatsApp Web */}
              <div className={`p-6 rounded-2xl border transition-all ${
                session.gatewayMode === "WHATSAPP_WEB"
                  ? "bg-teal-50/60 dark:bg-teal-950/30 border-teal-500 ring-2 ring-teal-500/20"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300">
                      Unrestricted Direct
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                      WhatsApp Web Linked Session
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Direct phone session linked via QR scan. Send any text or media instantly without waiting for Meta approvals.
                    </p>
                  </div>
                  {session.gatewayMode === "WHATSAPP_WEB" ? (
                    <span className="p-1 rounded-full bg-teal-600 text-white">
                      <Check className="w-4 h-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchGateway("WHATSAPP_WEB")}
                      disabled={switchingGateway}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-700 text-xs font-semibold hover:bg-teal-600"
                    >
                      Activate
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-teal-500" />
                    <span>Zero template approvals needed — send any text immediately</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-teal-500" />
                    <span>24/7 direct two-way messaging without 24h window restriction</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-teal-500" />
                    <span>₹0 Meta conversation charges</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
