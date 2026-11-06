"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Image as ImageIcon,
  Upload,
  FileText,
  Video,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Plus,
} from "lucide-react";

export default function MediaPage() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [filterType, setFilterType] = useState("");

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const json = await res.json();
        setMediaList(json.media || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      fetchMedia();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media file?")) return;
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMedia();
      }
    } catch (e) {}
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const filteredMedia = filterType
    ? mediaList.filter((m) => m.fileType === filterType)
    : mediaList;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-500" />
              <span>Digital Media Library</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Meta WhatsApp-compliant images, optical catalog PDFs, and store tour videos.
            </p>
          </div>

          <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer">
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>{uploading ? "Uploading..." : "Upload Media File"}</span>
            <input
              type="file"
              disabled={uploading}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
              className="hidden"
            />
          </label>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 text-xs">
          {["", "IMAGE", "DOCUMENT", "VIDEO"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                filterType === type
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {type || "All Formats"}
            </button>
          ))}
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            Loading media items...
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            No media files found. Click "Upload Media File" to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all"
              >
                {/* Thumbnail Preview */}
                <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                  {m.fileType === "IMAGE" ? (
                    <img
                      src={m.storageUrl}
                      alt={m.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : m.fileType === "DOCUMENT" ? (
                    <div className="flex flex-col items-center text-rose-500">
                      <FileText className="w-12 h-12" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">PDF Document</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-blue-500">
                      <Video className="w-12 h-12" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">MP4 Video</span>
                    </div>
                  )}

                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-sm">
                    {m.fileType}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white truncate" title={m.originalName}>
                    {m.originalName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{(m.fileSize / 1024).toFixed(1)} KB</span>
                    <span>{new Date(m.uploadedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => copyToClipboard(m.storageUrl, m.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === m.id ? "Copied" : "Copy URL"}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
