"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Edit2,
  ShieldCheck,
  Tag,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
} from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedOptIn, setSelectedOptIn] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    tags: "",
    optInStatus: "OPTED_IN",
    consentSource: "MANUAL",
    groupIds: [] as string[],
    notes: "",
  });

  // Bulk Import State
  const [importText, setImportText] = useState("");
  const [importGroupId, setImportGroupId] = useState("");
  const [duplicateHandling, setDuplicateHandling] = useState("SKIP");
  const [importSummary, setImportSummary] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        search,
        tag: selectedTag,
        groupId: selectedGroup,
        optInStatus: selectedOptIn,
      });

      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setContacts(json.contacts || []);
        setPagination(json.pagination || { total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const json = await res.json();
        setGroups(json.groups || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [page, search, selectedTag, selectedGroup, selectedOptIn]);

  // Handle Create or Update Contact
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingContact ? `/api/contacts/${editingContact.id}` : "/api/contacts";
      const method = editingContact ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to save contact");
        return;
      }

      setShowAddModal(false);
      setEditingContact(null);
      resetForm();
      fetchContacts();
    } catch (e: any) {
      alert(e.message || "Error saving contact");
    }
  };

  // Toggle Opt-Out Suppression
  const toggleOptOut = async (contact: any) => {
    const isCurrentlyOptedIn = contact.optInStatus === "OPTED_IN";
    const confirmMsg = isCurrentlyOptedIn
      ? `Suppress ${contact.name} (${contact.phone})? They will be excluded from all campaigns.`
      : `Re-enable marketing opt-in for ${contact.name}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/contacts/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          optOut: isCurrentlyOptedIn,
          reason: "ADMIN_TOGGLE",
        }),
      });

      if (res.ok) {
        fetchContacts();
      }
    } catch (e) {}
  };

  // Delete Contact
  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will remove all history.`)) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchContacts();
      }
    } catch (e) {}
  };

  // Bulk Import CSV/Text parser
  const handleBulkImport = async () => {
    if (!importText.trim()) {
      alert("Please paste CSV data or contact list");
      return;
    }

    setImporting(true);
    setImportSummary(null);

    // Simple robust parser: supports CSV format or Name,Phone,Email,City
    const lines = importText.trim().split("\n");
    const records = [];

    // Check if header line exists
    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.includes("phone") || firstLineLower.includes("name")) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length >= 2) {
        records.push({
          name: parts[0],
          phone: parts[1],
          email: parts[2] || undefined,
          city: parts[3] || undefined,
          tags: parts[4] || "csv_import",
        });
      }
    }

    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records,
          groupId: importGroupId || undefined,
          duplicateHandling,
          consentSource: "CSV_IMPORT",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setImportSummary(json.summary);
      fetchContacts();
    } catch (err: any) {
      alert(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      city: "",
      tags: "",
      optInStatus: "OPTED_IN",
      consentSource: "MANUAL",
      groupIds: [],
      notes: "",
    });
  };

  const openEditModal = (c: any) => {
    setEditingContact(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      city: c.city || "",
      tags: c.tags || "",
      optInStatus: c.optInStatus,
      consentSource: c.consentSource || "MANUAL",
      groupIds: c.groupMembers?.map((m: any) => m.groupId || m.group?.id) || [],
      notes: c.notes || "",
    });
    setShowAddModal(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <span>Contact Management & Optical CRM</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage optical customer profiles, consent records, and automated opt-out suppression.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/api/contacts/export"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>

            <button
              onClick={() => {
                setImportSummary(null);
                setImportText("");
                setShowImportModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Bulk Import</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setEditingContact(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.01]"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, phone (+91...), email, city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.totalMembers})
                </option>
              ))}
            </select>

            <select
              value={selectedOptIn}
              onChange={(e) => {
                setSelectedOptIn(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Opt-In Statuses</option>
              <option value="OPTED_IN">Subscribed (Opted In)</option>
              <option value="OPTED_OUT">Suppressed (Opted Out)</option>
            </select>
          </div>
        </div>

        {/* Contacts Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
              Loading contacts...
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No contacts found matching criteria. Click "Add Contact" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">WhatsApp Phone</th>
                    <th className="py-3 px-4">Location / Email</th>
                    <th className="py-3 px-4">Groups & Tags</th>
                    <th className="py-3 px-4">Opt-In Consent</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {contacts.map((c) => {
                    const isOptedIn = c.optInStatus === "OPTED_IN";

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                          {c.notes && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.notes}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {c.phone}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          <div>{c.city || "—"}</div>
                          <div className="text-[10px] text-slate-400">{c.email || "No email"}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {c.groupMembers?.map((m: any) => (
                              <span
                                key={m.group.name}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                {m.group.name}
                              </span>
                            ))}
                            {c.tags?.split(",").filter(Boolean).map((t: string) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                              >
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleOptOut(c)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                              isOptedIn
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-300 dark:border-rose-800"
                            }`}
                            title={isOptedIn ? "Click to suppress (Opt Out)" : "Click to re-opt-in"}
                          >
                            {isOptedIn ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Opted In</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Suppressed</span>
                              </>
                            )}
                          </button>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Source: {c.consentSource || "MANUAL"}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(c)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Contact"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(c.id, c.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {contacts.length} of {pagination.total} registered contacts
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Page {page} of {pagination.totalPages || 1}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Add / Edit Contact */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingContact ? "Edit Optical Contact" : "Add New Customer Contact"}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveContact} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Saxena"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Phone Number (E.164) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+919876543210 or 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Auto-normalizes to E.164. Indian 10-digit numbers automatically prefixed with +91.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ramesh@example.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="vip, sunglasses, progressive_lenses"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Opt-In Consent Status
                    </label>
                    <select
                      value={formData.optInStatus}
                      onChange={(e) => setFormData({ ...formData, optInStatus: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="OPTED_IN">OPTED IN (Subscribed)</option>
                      <option value="OPTED_OUT">OPTED OUT (Suppressed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Consent Source
                    </label>
                    <select
                      value={formData.consentSource}
                      onChange={(e) => setFormData({ ...formData, consentSource: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="STORE_PURCHASE">Store Purchase</option>
                      <option value="WEBSITE">Website Optical Form</option>
                      <option value="WHATSAPP_INBOUND">WhatsApp Inbound Enquiry</option>
                      <option value="MANUAL">Manual Walk-in</option>
                      <option value="CSV_IMPORT">Bulk Import</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Optical Notes / Prescription Info
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Right eye -1.50, Titanium rimless preference"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
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
                    {editingContact ? "Save Changes" : "Create Contact"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Bulk Import Contacts */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-500" />
                  <span>Bulk Import Optical Contacts (CSV / Excel Format)</span>
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign to Customer Group
                  </label>
                  <select
                    value={importGroupId}
                    onChange={(e) => setImportGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">All Customers (Default)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duplicate Phone Handling
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicate"
                        value="SKIP"
                        checked={duplicateHandling === "SKIP"}
                        onChange={() => setDuplicateHandling("SKIP")}
                      />
                      <span>Skip duplicate numbers (Safe)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicate"
                        value="UPDATE"
                        checked={duplicateHandling === "UPDATE"}
                        onChange={() => setDuplicateHandling("UPDATE")}
                      />
                      <span>Update existing details</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paste CSV Data (Name, Phone, Email, City, Tags)
                  </label>
                  <textarea
                    rows={6}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`Name, Phone, Email, City, Tags
Aarav Shah, +919811002233, aarav@example.com, Mumbai, designer_frames
Kavita Joshi, +919822113344, kavita@example.com, Pune, blue_light`}
                    className="w-full px-3 py-2 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports E.164 or 10-digit Indian numbers. Duplicates are checked against live database.
                  </p>
                </div>

                {/* Import Result Summary Card */}
                {importSummary && (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="font-bold text-slate-900 dark:text-white mb-1">Import Report:</div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded bg-white dark:bg-slate-900">
                        <div className="text-emerald-500 font-bold text-sm">{importSummary.importedCount}</div>
                        <div className="text-[10px] text-slate-500">Imported</div>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900">
                        <div className="text-amber-500 font-bold text-sm">{importSummary.duplicateCount}</div>
                        <div className="text-[10px] text-slate-500">Duplicates</div>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900">
                        <div className="text-rose-500 font-bold text-sm">{importSummary.errorCount}</div>
                        <div className="text-[10px] text-slate-500">Errors</div>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900">
                        <div className="text-blue-500 font-bold text-sm">{importSummary.totalRows}</div>
                        <div className="text-[10px] text-slate-500">Total Rows</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={importing}
                    onClick={handleBulkImport}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold"
                  >
                    {importing ? "Importing..." : "Process Bulk Import"}
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
