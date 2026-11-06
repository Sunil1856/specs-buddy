"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  MessageSquare,
  Search,
  Send,
  Clock,
  ShieldCheck,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Tag,
  StickyNote,
  UserCheck,
  Check,
  CheckCheck,
  Sparkles,
  RefreshCw,
  FileText,
} from "lucide-react";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [activeConv, setActiveConv] = useState<any>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  // Notes state
  const [noteText, setNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "notes">("chat");

  // Template sending outside 24h window
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Simulation modal
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simPhone, setSimPhone] = useState("+919820011221");
  const [simName, setSimName] = useState("Aarav Mehta");
  const [simMessage, setSimMessage] = useState("Hi, are your opticians available today for an eye test?");

  const fetchConversations = async () => {
    try {
      const url = search ? `/api/inbox/conversations?search=${search}` : "/api/inbox/conversations";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setConversations(json.conversations || []);
        if (!activeConvId && json.conversations?.length > 0) {
          setActiveConvId(json.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchActiveConversation = async (id: string) => {
    if (!id) return;
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${id}`);
      if (res.ok) {
        const json = await res.json();
        setActiveConv(json.conversation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChat(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates?status=APPROVED");
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.templates || []);
        if (json.templates?.length > 0) {
          setSelectedTemplateId(json.templates[0].id);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConversations();
    fetchTemplates();
    const interval = setInterval(() => {
      fetchConversations();
      if (activeConvId) fetchActiveConversation(activeConvId);
    }, 5000);
    return () => clearInterval(interval);
  }, [search]);

  useEffect(() => {
    if (activeConvId) {
      fetchActiveConversation(activeConvId);
    }
  }, [activeConvId]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId) return;

    const isWhatsAppWeb = activeConv?.gatewayMode === "WHATSAPP_WEB";
    const isWindowActive = isWhatsAppWeb || Boolean(activeConv?.serviceWindow?.isActive);

    if (!isWindowActive && !selectedTemplateId) {
      alert("24-Hour Customer Service Window is expired. Please select an approved Meta template.");
      return;
    }

    if (isWindowActive && !messageText.trim()) return;

    setSending(true);

    try {
      const res = await fetch(`/api/inbox/conversations/${activeConvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_MESSAGE",
          messageText: isWindowActive ? messageText.trim() : undefined,
          templateId: !isWindowActive ? selectedTemplateId : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setMessageText("");
      fetchActiveConversation(activeConvId);
      fetchConversations();
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !activeConvId) return;

    try {
      const res = await fetch(`/api/inbox/conversations/${activeConvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_NOTE",
          noteContent: noteText.trim(),
        }),
      });

      if (res.ok) {
        setNoteText("");
        fetchActiveConversation(activeConvId);
      }
    } catch (e) {}
  };

  // Trigger Simulated Inbound Customer Message
  const handleSimulateInbound = async () => {
    try {
      const res = await fetch("/api/inbox/simulate-inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: simPhone,
          name: simName,
          messageText: simMessage,
        }),
      });

      if (res.ok) {
        setShowSimulateModal(false);
        fetchConversations();
        if (activeConvId) fetchActiveConversation(activeConvId);
      }
    } catch (e) {}
  };

  const isWhatsAppWeb = activeConv?.gatewayMode === "WHATSAPP_WEB";
  const isWindowActive = isWhatsAppWeb || Boolean(activeConv?.serviceWindow?.isActive);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-100px)] flex flex-col space-y-3">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              <span>WhatsApp Live Inbox</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              Live Gateway
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulation Trigger Button */}
            <button
              onClick={() => setShowSimulateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
              title="Test receiving an inbound message or 'STOP' opt-out command"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Customer Inbound</span>
            </button>
          </div>
        </div>

        {/* 3-Column WhatsApp Web Layout */}
        <div className="flex-1 grid grid-cols-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-0">
          {/* Column 1: Conversations List */}
          <div className="col-span-12 sm:col-span-4 lg:col-span-3 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
            {/* Search */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {loadingList ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading chats...</div>
              ) : conversations.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">No conversations yet</div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConvId === c.id;
                  const windowActive = c.serviceWindow?.isActive;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvId(c.id)}
                      className={`w-full p-3 text-left flex items-start gap-3 transition-colors ${
                        isActive
                          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-l-4 border-emerald-500"
                          : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {c.contactName?.charAt(0) || "C"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {c.contactName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {c.lastMessage || "No messages yet"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {windowActive ? (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                              24h Active ({c.serviceWindow?.hoursRemaining}h)
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950 px-1.5 py-0.2 rounded">
                              Window Expired
                            </span>
                          )}
                          {c.unreadCount > 0 && (
                            <span className="ml-auto text-[10px] font-bold bg-emerald-500 text-white rounded-full px-1.5">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Chat Canvas */}
          <div className="col-span-12 sm:col-span-8 lg:col-span-6 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {activeConv.contactName?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{activeConv.contactName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({activeConv.phone})</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {activeConv.contact?.city || "Customer"} • Opt-In: <span className="text-emerald-500 font-semibold">{activeConv.contact?.optInStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab("chat")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        activeTab === "chat"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setActiveTab("notes")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        activeTab === "notes"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                      <span>Notes ({activeConv.notes?.length || 0})</span>
                    </button>
                  </div>
                </div>

                {/* CUSTOMER SERVICE WINDOW & GATEWAY BANNER */}
                <div
                  className={`px-3 py-2 text-xs font-medium border-b flex items-center justify-between ${
                    isWhatsAppWeb
                      ? "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800"
                      : isWindowActive
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isWhatsAppWeb ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>
                          WhatsApp Web Gateway Active. Direct 24/7 two-way messaging enabled without Meta template restrictions.
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {isWindowActive
                            ? `Customer Service Window Active (${activeConv.serviceWindow?.hoursRemaining}h ${activeConv.serviceWindow?.minutesRemaining}m remaining). Free-form messaging enabled.`
                            : "24-Hour Window Expired. Free-form messaging disabled per Meta policy. Choose an approved WhatsApp template to re-engage."}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages Canvas or Notes Tab */}
                {activeTab === "chat" ? (
                  <div className="flex-1 whatsapp-chat-bg p-4 overflow-y-auto space-y-3">
                    {activeConv.messages?.map((msg: any) => {
                      const isOutbound = msg.direction === "OUTBOUND";

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl p-3 shadow-sm text-xs leading-relaxed ${
                              isOutbound
                                ? "bg-[#E7FFDB] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-xs"
                                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs"
                            }`}
                          >
                            <p className="whitespace-pre-line">{msg.body}</p>
                            <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-400">
                              <span>
                                {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOutbound && (
                                <span className="text-cyan-500 font-bold">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Internal Team Notes Tab */
                  <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/40 overflow-y-auto space-y-3">
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <textarea
                        rows={2}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add an internal staff note (e.g. Eyewear prescription confirmed, preferred frame color...)"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Save Note
                      </button>
                    </form>

                    <div className="space-y-2 pt-2">
                      {activeConv.notes?.map((n: any) => (
                        <div key={n.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                          <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{n.authorName}</span>
                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Input Bar */}
                {activeTab === "chat" && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800">
                    {isWindowActive ? (
                      /* Free-form reply permitted */
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type free-form reply..."
                          className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="submit"
                          disabled={sending || !messageText.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </button>
                      </form>
                    ) : (
                      /* Template required */
                      <form onSubmit={handleSendMessage} className="space-y-2">
                        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          Select Approved WhatsApp Template to send:
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                          >
                            {templates.map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.name} ({tpl.category})
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            disabled={sending}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Template</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-xs">
                <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                <span>Select a conversation from the left to view messages</span>
              </div>
            )}
          </div>

          {/* Column 3: Contact Sidebar Details */}
          <div className="hidden lg:flex lg:col-span-3 flex-col h-full bg-slate-50/40 dark:bg-slate-900/30 p-4 overflow-y-auto space-y-4 text-xs">
            {activeConv ? (
              <>
                <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                    {activeConv.contactName?.charAt(0)}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                    {activeConv.contactName}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">{activeConv.phone}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">City</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{activeConv.contact?.city || "Not specified"}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {activeConv.contact?.tags?.split(",").map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 font-semibold">
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Consent History</span>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Source: {activeConv.contact?.consentSource || "MANUAL"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Assigned Specialist</span>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {activeConv.assignedTo?.name || "Unassigned"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-center py-10">No customer profile</div>
            )}
          </div>
        </div>

        {/* Modal: Simulate Customer Reply */}
        {showSimulateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <span>Simulate Inbound Customer Message</span>
                </h3>
                <button onClick={() => setShowSimulateModal(false)} className="text-slate-400">✕</button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <p className="text-slate-500">
                  Simulate an incoming message from a WhatsApp customer to test live chat updates, reset the 24-hr customer service window, or test automated opt-out keywords ("STOP").
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Text</label>
                  <textarea
                    rows={3}
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    placeholder="e.g. STOP to unsubscribe, or enquiry message"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSimMessage("STOP")}
                    className="px-2 py-1 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold text-[10px]"
                  >
                    Quick: Reply "STOP" (Test Opt-Out)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMessage("Can I get an anti-reflective coating on these frames?")}
                    className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-[10px]"
                  >
                    Quick: Optical Question
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSimulateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateInbound}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Send Inbound Simulation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
