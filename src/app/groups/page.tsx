"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const json = await res.json();
        setGroups(json.groups || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setName("");
      setDescription("");
      setShowAddModal(false);
      fetchGroups();
    } catch (e: any) {
      alert(e.message || "Failed to create group");
    }
  };

  const handleDeleteGroup = async (id: string, groupName: string) => {
    if (!confirm(`Delete custom group '${groupName}'? Contacts in this group will not be deleted.`)) return;
    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchGroups();
      }
    } catch (e) {}
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-emerald-500" />
              <span>Customer Groups & Audience Segments</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organize optical customer audiences into targeted marketing segments.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Custom Group</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            Loading groups...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {g.name}
                    </span>
                    {g.isSystem ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        System Group
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteGroup(g.id, g.name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                    {g.description || "No description provided."}
                  </p>

                  {/* Membership breakdown */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white">
                        {g.totalMembers}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Total</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-emerald-500">
                        {g.optedInMembers}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Opted In</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-rose-500">
                        {g.optedOutMembers}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Suppressed</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link
                    href={`/contacts?groupId=${g.id}`}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Contacts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/campaigns/new?groupId=${g.id}`}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    Campaign
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Custom Group */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Create Custom Group
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleCreateGroup} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Progressive Lens Re-orderers"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Eyewear customers who need bi-focal or progressive lens updates"
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
                    Save Group
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
