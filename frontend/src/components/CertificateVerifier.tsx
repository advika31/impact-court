"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Certificate, verifyCertificate } from "@/lib/api";

export default function CertificateVerifier({ certificate }: { certificate: Certificate | null }) {
  const [valid, setValid] = useState<boolean | null>(null);
  const [failures, setFailures] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const runVerify = async () => {
    if (!certificate) return;
    setBusy(true); setError("");
    try { const result = await verifyCertificate(certificate.certificate_id); setValid(result.verification.valid); setFailures(result.verification.failures || []); }
    catch (err) { setError(err instanceof Error ? err.message : "Verification failed"); }
    finally { setBusy(false); }
  };
  if (!certificate) return <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">No certificate is loaded. Audit a claim and issue a certificate from Claim Court first.</div>;
  return <div className="flex flex-col gap-5 w-full">
    <div className={`rounded-2xl border p-5 ${valid === false ? "border-rose-500/40 bg-rose-950/20" : "border-emerald-500/30 bg-emerald-950/20"}`}>
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3">{valid === false ? <AlertTriangle className="h-7 w-7 text-rose-400" /> : <ShieldCheck className="h-7 w-7 text-emerald-400" />}<div><h3 className="text-lg font-bold text-white">{valid === true ? "Certificate verified" : valid === false ? "Verification failed" : "Certificate issued"}</h3><p className="text-xs text-slate-400">Certificate {certificate.certificate_id} · Claim {certificate.claim_id}</p></div></div><button onClick={runVerify} disabled={busy} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Re-verify with API</button></div>
    </div>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {failures.map((failure, index) => <p key={index} className="text-xs text-rose-300">{failure}</p>)}
    <div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h4 className="text-xs font-semibold uppercase text-slate-400">Signed certificate</h4><dl className="mt-3 flex flex-col gap-3 text-xs font-mono"><dt className="text-slate-500">Merkle root</dt><dd className="break-all text-emerald-300">{certificate.merkle_root}</dd><dt className="text-slate-500">Signature</dt><dd className="break-all text-cyan-300">{certificate.signature}</dd><dt className="text-slate-500">Public key</dt><dd className="break-all text-slate-300">{certificate.public_key}</dd></dl></div><div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h4 className="text-xs font-semibold uppercase text-slate-400">Certificate leaves ({certificate.leaves.length})</h4><div className="mt-3 max-h-64 overflow-y-auto flex flex-col gap-2">{certificate.leaves.map((leaf, index) => <div key={`${leaf.kind}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs"><span className="mr-2 rounded bg-slate-800 px-1.5 py-0.5 uppercase text-slate-400">{leaf.kind}</span><span className="break-all font-mono text-slate-300">{String(leaf.sha256 || leaf.asset_id || leaf.url || "").slice(0, 120)}</span></div>)}</div></div></div>
  </div>;
}
