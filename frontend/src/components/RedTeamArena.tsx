"use client";

import React, { useState } from "react";
import { Loader2, ShieldAlert, UploadCloud } from "lucide-react";
import { redteamCheck, RedTeamResult, uploadSuspectImage } from "@/lib/api";

export default function RedTeamArena({ projectId }: { projectId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<RedTeamResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async () => {
    if (!file) return;
    setBusy(true); setError(""); setReport(null);
    try {
      const publicId = await uploadSuspectImage(projectId, file);
      setReport(await redteamCheck(projectId, publicId));
    } catch (err) { setError(err instanceof Error ? err.message : "Red-team check failed"); }
    finally { setBusy(false); }
  };
  const details = report?.report as Record<string, unknown> | undefined;
  const geo = details?.geo_check as Record<string, unknown> | undefined;
  const time = details?.time_check as Record<string, unknown> | undefined;
  const exif = details?.exif as Record<string, unknown> | undefined;
  const duplicates = (details?.duplicates as Array<Record<string, unknown>> | undefined) || [];
  const flags = (details?.flags as string[] | undefined) || [];

  return <div className="flex flex-col gap-5 w-full">
    <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 to-slate-900/80 border border-rose-500/20 flex items-center gap-3"><ShieldAlert className="w-7 h-7 text-rose-400" /><div><h3 className="text-lg font-bold text-white">Red-team an image</h3><p className="text-xs text-slate-400">Upload a suspect image to Cloudinary and request a live forensic and duplicate check.</p></div></div>
    <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
      <label className="flex flex-col gap-2 text-xs text-slate-400">Suspect image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { setFile(e.target.files?.[0] || null); setReport(null); }} className="text-slate-200" /></label>
      <button onClick={run} disabled={busy || !file} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Upload and analyze</button>
    </div>
    {busy && <p role="status" className="text-sm text-slate-400">Uploading image and checking metadata and perceptual-hash matches…</p>}
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {report && <section className={`rounded-2xl border p-5 ${details?.hard_fail ? "border-rose-500/50 bg-rose-950/20" : "border-amber-500/30 bg-amber-950/10"}`}>
      <h4 className="text-lg font-bold text-white">{report.verdict}</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs"><div className="rounded-lg bg-slate-950/60 p-3"><span className="text-slate-500">LOCATION</span><p className="mt-1 text-slate-200">{geo?.distance_km == null ? "No GPS metadata" : `${geo.distance_km} km · ${geo.within_site ? "inside site" : "outside site"}`}</p></div><div className="rounded-lg bg-slate-950/60 p-3"><span className="text-slate-500">TIME WINDOW</span><p className="mt-1 text-slate-200">{time?.within_window == null ? "Unknown" : time.within_window ? "Inside project window" : "Outside project window"}</p></div><div className="rounded-lg bg-slate-950/60 p-3"><span className="text-slate-500">DUPLICATES</span><p className="mt-1 text-slate-200">{duplicates.length ? `${duplicates.length} candidate(s)` : "No matching stored hash"}</p></div><div className="rounded-lg bg-slate-950/60 p-3"><span className="text-slate-500">EDITING SOFTWARE</span><p className="mt-1 text-slate-200">{String(exif?.software || "Not identified")}</p></div></div>
      {!!flags.length && <p className="mt-3 text-xs text-rose-300">Flags: {flags.join(", ")}</p>}
      {duplicates.map((dup, i) => <p key={i} className="mt-2 text-xs text-slate-300">Possible match: asset {String(dup.asset_id)} in project {String(dup.project_id)} ({String(dup.kind)}, similarity {String(dup.similarity)})</p>)}
      <p className="mt-3 text-[11px] text-slate-500">The forensic results are signals and heuristics; they do not prove that an image is authentic or manipulated.</p>
    </section>}
  </div>;
}
