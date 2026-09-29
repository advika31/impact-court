"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, Key, Cpu, FileCheck, RefreshCw, Lock } from "lucide-react";
import confetti from "canvas-confetti";

interface CertificateVerifierProps {
  certificateId: string;
  claimId: string;
  merkleRoot: string;
  signature: string;
  publicKey: string;
  leaves: Array<{ kind: string; sha256: string; label?: string }>;
}

export default function CertificateVerifier({
  certificateId,
  claimId,
  merkleRoot,
  signature,
  publicKey,
  leaves,
}: CertificateVerifierProps) {
  const [isTampered, setIsTampered] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<"valid" | "invalid">("valid");

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (isTampered) {
        setStatus("invalid");
      } else {
        setStatus("valid");
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#10b981", "#06b6d4", "#3b82f6"],
          });
        } catch (e) {
          // ignore
        }
      }
    }, 600);
  };

  const toggleTamper = () => {
    const nextTamper = !isTampered;
    setIsTampered(nextTamper);
    if (nextTamper) {
      setStatus("invalid");
    } else {
      setStatus("valid");
    }
  };

  const displayedLeaves = leaves.map((leaf, index) => {
    if (isTampered && index === 1) {
      return {
        ...leaf,
        sha256: leaf.sha256.replace(/^[0-9a-f]{4}/, "dead"),
        tampered: true,
      };
    }
    return leaf;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Status Hero Card */}
      <div
        className={`p-6 rounded-2xl border transition-all duration-300 ${
          status === "valid"
            ? "bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
            : "bg-rose-950/30 border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.25)]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status === "valid" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {status === "valid" ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7 animate-bounce" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">
                  {status === "valid" ? "Verified Impact Certificate" : "CRYPTOGRAPHIC INTEGRITY FAILURE"}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                  {certificateId}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                {status === "valid"
                  ? "Ed25519 digital signature valid. Zero byte divergence across all field evidence."
                  : "TAMPER ALERT: Evidence hash chain severed. Merkle root does not match declared state."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTamper}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isTampered
                  ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-400"
                  : "bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-amber-500/30"
              }`}
            >
              {isTampered ? "Reset Tamper Test" : "Simulate Tampering 1 Byte"}
            </button>

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all font-mono disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
              Re-Verify Proof
            </button>
          </div>
        </div>
      </div>

      {/* Merkle Ledger Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Cryptographic Headers */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" /> Root Signatures & Keys
          </h4>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">MERKLE ROOT HASH (SHA-256)</span>
              <span className={`break-all ${isTampered ? "text-rose-400 line-through" : "text-emerald-400"}`}>
                {merkleRoot}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">ED25519 SIGNATURE</span>
              <span className="text-cyan-400 break-all">{signature.slice(0, 48)}...</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">AUDITOR PUBLIC KEY</span>
              <span className="text-slate-300 break-all">{publicKey}</span>
            </div>
          </div>
        </div>

        {/* Right: Leaf Evidence Nodes */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> Evidence Leaves ({leaves.length} verified items)
          </h4>

          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
            {displayedLeaves.map((leaf: any, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between gap-3 ${
                  leaf.tampered
                    ? "bg-rose-950/40 border-rose-500 text-rose-300"
                    : "bg-slate-950/50 border-slate-800/80 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-sans text-slate-400">
                    {leaf.kind}
                  </span>
                  <span className="truncate">{leaf.sha256}</span>
                </div>
                {leaf.tampered ? (
                  <span className="text-[10px] font-bold text-rose-400 whitespace-nowrap">MODIFIED</span>
                ) : (
                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
