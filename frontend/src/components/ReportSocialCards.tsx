"use client";

import React, { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { apiUrl, Asset, cloudinaryUrl, createReport, ReportResult } from "@/lib/api";

export default function ReportSocialCards({ claimId, projectId, assets }: { claimId: string | null; projectId: string; assets: Asset[] }) {
  const [report, setReport] = useState<ReportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generate = async () => {
    if (!claimId) return;
    setBusy(true); setError("");
    try { setReport(await createReport(claimId)); }
    catch (err) { setError(err instanceof Error ? err.message : "Report generation failed"); }
    finally { setBusy(false); }
  };
  const preview = assets[0];
  return <div className="flex flex-col gap-5 w-full">
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-400" /><h3 className="text-lg font-bold text-white">Claim audit report</h3></div><p className="mt-2 text-xs text-slate-400">Generate a PDF from the selected audited claim, its evidence links, and its latest certificate.</p></div>
    {!claimId && <p className="rounded-xl border border-slate-800 p-5 text-sm text-slate-400">Create or select a claim in Claim Court before generating a report.</p>}
    {claimId && <button onClick={generate} disabled={busy} className="flex w-fit items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-slate-950 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate PDF report</button>}
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {report && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5"><p className="text-sm font-semibold text-emerald-200">Report generated · {report.size_bytes.toLocaleString()} bytes</p><a href={apiUrl(report.download_url)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-950"><Download className="h-4 w-4" /> Open / download PDF</a></div>}
    {report?.social_cards?.length ? <div className="grid gap-4 sm:grid-cols-2">{report.social_cards.map((card) => <article key={card.asset_id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"><img src={card.url} alt="Cloudinary verified impact social card" className="w-full aspect-video object-cover" /><div className="p-3"><p className="break-all font-mono text-[11px] text-slate-400">{card.source_public_id}</p><a href={card.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-cyan-300 underline">Open Cloudinary transformation</a></div></article>)}</div> : report && <p className="text-xs text-slate-400">No Cloudinary verified social cards were returned. Issue a certificate for the claim and generate the report again to include them.</p>}
    {!report && preview && <div className="max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"><div className="relative h-64 bg-slate-950">{cloudinaryUrl(preview.cloudinary_public_id, preview.resource_type) && <img src={cloudinaryUrl(preview.cloudinary_public_id, preview.resource_type)} alt="Project evidence" className="h-full w-full object-cover" />}<span className="absolute right-3 top-3 rounded-full bg-slate-950/90 px-3 py-1.5 text-[10px] font-bold text-slate-200">SOURCE EVIDENCE</span></div><div className="p-4 text-xs text-slate-300"><p className="font-semibold">Project {projectId}</p><p className="mt-1 break-all font-mono text-slate-500">Source: {preview.cloudinary_public_id}</p></div></div>}
  </div>;
}
