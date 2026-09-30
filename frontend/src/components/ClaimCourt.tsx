"use client";

import React, { useState } from "react";
import { Award, Loader2, Scale, Sparkles } from "lucide-react";
import { auditClaim, Claim, fetchClaim, fetchClaimEvidence, issueCertificate, SubClaim, submitClaim, Certificate } from "@/lib/api";

interface Props { projectId: string; initialClaimId?: string | null; onClaimSelected?: (claimId: string) => void; onCertificateIssued: (certificate: Certificate) => void }

export default function ClaimCourt({ projectId, initialClaimId, onClaimSelected, onCertificateIssued }: Props) {
  const [claimText, setClaimText] = useState("");
  const [claim, setClaim] = useState<Claim | null>(null);
  const [subclaims, setSubclaims] = useState<SubClaim[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [evidenceCount, setEvidenceCount] = useState<number | null>(null);

  React.useEffect(() => {
    if (!initialClaimId) return;
    let cancelled = false;
    fetchClaim(initialClaimId).then((result) => {
      if (!cancelled) { setClaim(result.claim); setClaimText(result.claim.text); setSubclaims(result.subclaims); }
    }).catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Could not load claim"); });
    return () => { cancelled = true; };
  }, [initialClaimId]);

  const create = async () => {
    setBusy(true); setError("");
    try { const result = await submitClaim(projectId, claimText.trim()); setClaim(result.claim); setSubclaims(result.subclaims); setEvidenceCount(null); onClaimSelected?.(result.claim.id); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not create claim"); }
    finally { setBusy(false); }
  };
  const audit = async () => {
    if (!claim) return;
    setBusy(true); setError("");
    try {
      const result = await auditClaim(claim.id); setClaim(result.claim); setSubclaims(result.subclaims);
      const evidence = await fetchClaimEvidence(claim.id); setEvidenceCount(evidence.length);
    } catch (err) { setError(err instanceof Error ? err.message : "Audit failed"); }
    finally { setBusy(false); }
  };
  const certify = async () => {
    if (!claim) return;
    setBusy(true); setError("");
    try { onCertificateIssued(await issueCertificate(claim.id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Certificate could not be issued"); }
    finally { setBusy(false); }
  };

  const verdict = claim?.overall_verdict || "Pending";
  return <div className="flex flex-col gap-6 w-full">
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm"><Scale className="w-4 h-4 text-emerald-400" /> Submit an impact claim for audit</div>
      <textarea value={claimText} onChange={(e) => setClaimText(e.target.value)} rows={3} disabled={busy || !!claim} className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm disabled:opacity-70" placeholder="For example: We planted 500 trees at Site A this spring." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-400">Claim decomposition, evidence retrieval and scoring run through the FastAPI service.</span>
        {!claim && <button onClick={create} disabled={busy || !claimText.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Create and decompose</button>}
      </div>
      {claim && <div className="text-xs text-slate-300">Claim ID <code>{claim.id}</code> · {claim.status}</div>}
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    </div>
    {subclaims.length > 0 && <section className="flex flex-col gap-3">
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div><h3 className="text-sm font-bold text-white">Sub-claims ({subclaims.length})</h3><p className="text-xs text-slate-400 mt-1">Current overall result: {verdict}{claim?.overall_confidence != null ? ` · ${(claim.overall_confidence * 100).toFixed(0)}% confidence` : ""}</p></div>
        {claim?.status !== "audited" && claim?.status !== "certified" && <button onClick={audit} disabled={busy} className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold disabled:opacity-50">{busy ? "Auditing…" : "Run evidence audit"}</button>}
        {(claim?.status === "audited" || claim?.status === "certified") && <button onClick={certify} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold disabled:opacity-50"><Award className="w-4 h-4" /> Issue certificate</button>}
      </div>
      {evidenceCount !== null && <p className="text-xs text-slate-400">Persisted evidence links: {evidenceCount}</p>}
      {subclaims.map((sc) => <article key={sc.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
        <div className="flex flex-wrap justify-between gap-2"><div><span className="text-[10px] uppercase text-slate-500 mr-2">{sc.type}</span><span className="text-sm font-semibold text-slate-200">{sc.statement}</span></div><span className="text-xs font-mono text-emerald-300">{sc.verdict || "pending"}{sc.confidence != null ? ` · ${(sc.confidence * 100).toFixed(0)}%` : ""}</span></div>
        {sc.reasons?.map((reason, index) => <p key={index} className="text-xs text-slate-400">• {reason}</p>)}
      </article>)}
    </section>}
  </div>;
}
