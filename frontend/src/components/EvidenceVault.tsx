"use client";

import React, { useEffect, useState } from "react";
import { Camera, MapPin, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Asset, cloudinaryUrl, fetchAssets } from "@/lib/api";

interface Props { projectId: string; assets: Asset[] }

export default function EvidenceVault({ projectId, assets: initialAssets }: Props) {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      fetchAssets(projectId, query).then(setAssets).catch((err) => setError(err instanceof Error ? err.message : "Search failed")).finally(() => setLoading(false));
    }, query.trim() ? 250 : 0);
    return () => clearTimeout(timer);
  }, [projectId, query]);

  return <div className="flex flex-col gap-5 w-full">
    <div className="relative w-full sm:max-w-lg">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search evidence by semantic description or activity…" className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100" />
    </div>
    {loading && <p className="text-xs text-slate-400">Searching project evidence…</p>}
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {!loading && assets.length === 0 && <p className="rounded-xl border border-slate-800 p-6 text-sm text-slate-400">No assets found for this project. Upload images from the customer portal to populate the vault.</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {assets.map((asset) => {
        const flagged = Boolean(asset.forensics_json?.hard_fail || asset.forensics_json?.flags?.length);
        const imageUrl = cloudinaryUrl(asset.cloudinary_public_id, asset.resource_type);
        return <article key={asset.id} className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="relative h-48 bg-slate-950">
            {imageUrl ? <img src={imageUrl} alt={asset.cloudinary_public_id} className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-xs text-slate-500">Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to show previews</div>}
            <span className={`absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${flagged ? "bg-rose-950/90 text-rose-300" : "bg-slate-950/90 text-emerald-300"}`}>{flagged ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}{flagged ? "Flagged" : "Ingested"}</span>
            {asset.activity_label && <span className="absolute bottom-3 right-3 rounded bg-black/80 px-2 py-1 text-[10px] text-cyan-200">{asset.activity_label}{asset.activity_score != null ? ` · ${(asset.activity_score * 100).toFixed(0)}%` : ""}</span>}
          </div>
          <div className="p-4 flex flex-col gap-2 text-xs">
            <p className="font-mono text-slate-200 break-all">{asset.cloudinary_public_id}</p>
            <p className="font-mono text-slate-500 break-all">SHA-256 {asset.sha256}</p>
            <div className="flex gap-3 text-slate-400"><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{asset.lat != null && asset.lng != null ? `${asset.lat.toFixed(4)}, ${asset.lng.toFixed(4)}` : "No GPS"}</span><span className="inline-flex items-center gap-1"><Camera className="w-3 h-3" />{asset.capture_time ? new Date(asset.capture_time).toLocaleDateString() : "No capture time"}</span></div>
            {!!asset.forensics_json?.flags?.length && <p className="text-rose-300">{asset.forensics_json.flags.join(", ")}</p>}
          </div>
        </article>;
      })}
    </div>
  </div>;
}
