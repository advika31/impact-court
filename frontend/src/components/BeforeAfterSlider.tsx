"use client";

import React, { useMemo, useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { Asset, cloudinaryUrl, compareAssets, Comparison } from "@/lib/api";

export default function BeforeAfterSlider({ assets }: { assets: Asset[] }) {
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const before = useMemo(() => assets.find((a) => a.id === beforeId), [assets, beforeId]);
  const after = useMemo(() => assets.find((a) => a.id === afterId), [assets, afterId]);

  const run = async () => {
    if (!before || !after) return;
    setBusy(true); setError("");
    try { setComparison(await compareAssets(before.id, after.id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Comparison failed"); }
    finally { setBusy(false); }
  };

  return <div className="flex flex-col gap-5 w-full">
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-slate-400">Before image<select value={beforeId} onChange={(e) => { setBeforeId(e.target.value); setComparison(null); }} className="min-w-56 rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-100"><option value="">Choose an asset</option>{assets.map((a) => <option key={a.id} value={a.id}>{a.cloudinary_public_id} · {a.capture_time || "date unknown"}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-xs text-slate-400">After image<select value={afterId} onChange={(e) => { setAfterId(e.target.value); setComparison(null); }} className="min-w-56 rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-100"><option value="">Choose an asset</option>{assets.map((a) => <option key={a.id} value={a.id}>{a.cloudinary_public_id} · {a.capture_time || "date unknown"}</option>)}</select></label>
      <button onClick={run} disabled={busy || !before || !after || before.id === after.id} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-40">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <SlidersHorizontal className="w-4 h-4" />} Analyze pair</button>
    </div>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {assets.length < 2 && <p className="text-sm text-slate-400">Ingest at least two images for this project to compare them.</p>}
    {comparison && before && after && <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><figure><img src={cloudinaryUrl(before.cloudinary_public_id, before.resource_type)} alt="Before state" className="w-full h-72 object-cover rounded-xl" /><figcaption className="text-xs text-slate-400 mt-2">Before · {before.capture_time || before.cloudinary_public_id}</figcaption></figure><figure><img src={cloudinaryUrl(after.cloudinary_public_id, after.resource_type)} alt="After state" className="w-full h-72 object-cover rounded-xl" /><figcaption className="text-xs text-slate-400 mt-2">After · {after.capture_time || after.cloudinary_public_id}</figcaption></figure></div>
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4"><h3 className="text-sm font-semibold text-white">Model comparison</h3><pre className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">{JSON.stringify(comparison.analysis_json || { alignment_score: comparison.alignment_score, class_delta_pct: comparison.class_delta_json }, null, 2)}</pre>{comparison.transform_urls?.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 underline break-all">Open Cloudinary comparison transformation</a>)}</div>
    </div>}
  </div>;
}
