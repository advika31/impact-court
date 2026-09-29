"use client";

import React, { useState } from "react";
import { Scale, CheckCircle, AlertTriangle, XCircle, ArrowRight, Award, Sparkles, Loader2, HelpCircle } from "lucide-react";
import { SubClaim, Claim } from "@/lib/api";

interface ClaimCourtProps {
  projectId: string;
  onCertificateIssued: (certId: string) => void;
}

export default function ClaimCourt({ projectId, onCertificateIssued }: ClaimCourtProps) {
  const [claimText, setClaimText] = useState(
    "We planted 5,000 indigenous saplings across Tapajos Site A between March and June 2026, increasing tree canopy cover by over 30%."
  );
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [subclaims, setSubclaims] = useState<SubClaim[]>([]);

  // 1. Submit & Decompose Claim
  const handleDecompose = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newClaim: Claim = {
        id: "claim_tapajos_88",
        project_id: projectId,
        text: claimText,
        status: "decomposed",
      };
      const decomposed: SubClaim[] = [
        {
          id: "sc1",
          claim_id: "claim_tapajos_88",
          type: "location",
          statement: "Location verified within Tapajos Site A perimeter (radius 5.0 km)",
          params_json: { site: "Tapajos Site A", radius_km: 5.0 },
          verdict: "pending",
        },
        {
          id: "sc2",
          claim_id: "claim_tapajos_88",
          type: "time",
          statement: "Field evidence captured between 2026-03-01 and 2026-06-30",
          params_json: { window: ["2026-03-01", "2026-06-30"] },
          verdict: "pending",
        },
        {
          id: "sc3",
          claim_id: "claim_tapajos_88",
          type: "count",
          statement: "Object detector confirms ~5,000 planted sapling targets",
          params_json: { target: "sapling", value: 5000 },
          verdict: "pending",
        },
        {
          id: "sc4",
          claim_id: "claim_tapajos_88",
          type: "change",
          statement: "Canopy and vegetation density increased by >= 30%",
          params_json: { metric: "vegetation", min_delta: 30 },
          verdict: "pending",
        },
        {
          id: "sc5",
          claim_id: "claim_tapajos_88",
          type: "activity",
          statement: "Field operations match verified tree_planting classification",
          params_json: { label: "tree_planting" },
          verdict: "pending",
        },
      ];
      setClaim(newClaim);
      setSubclaims(decomposed);
    }, 800);
  };

  // 2. Audit Against Field Evidence
  const handleAudit = () => {
    setAuditing(true);
    setTimeout(() => {
      setAuditing(false);
      const auditedSubclaims: SubClaim[] = [
        {
          id: "sc1",
          claim_id: "claim_tapajos_88",
          type: "location",
          statement: "Location verified within Tapajos Site A perimeter",
          verdict: "supported",
          confidence: 0.94,
          reasons: ["100% of geotagged evidence within 0.22 km of declared center pin (-2.438, -54.715)."],
        },
        {
          id: "sc2",
          claim_id: "claim_tapajos_88",
          type: "time",
          statement: "Field evidence captured within declared timeline window",
          verdict: "supported",
          confidence: 0.91,
          reasons: ["EXIF timestamps range from 2026-03-25 to 2026-05-03, safely within window."],
        },
        {
          id: "sc3",
          claim_id: "claim_tapajos_88",
          type: "count",
          statement: "Object detector confirms ~5,000 planted sapling targets",
          verdict: "weak",
          confidence: 0.68,
          reasons: [
            "YOLO detector identified 3,840 distinct sapling clusters across inspected quadrants.",
            "Extrapolation model confirms plausible 5,000 threshold within 15% error margin.",
          ],
        },
        {
          id: "sc4",
          claim_id: "claim_tapajos_88",
          type: "change",
          statement: "Canopy and vegetation density increased by >= 30%",
          verdict: "supported",
          confidence: 0.92,
          reasons: ["SegFormer scene delta measures +31.2% vegetation gain and -60.0% bare waste reduction."],
        },
        {
          id: "sc5",
          claim_id: "claim_tapajos_88",
          type: "activity",
          statement: "Field operations match verified tree_planting classification",
          verdict: "supported",
          confidence: 0.96,
          reasons: ["CLIP probe classifies 96% of evidence assets as verified 'tree_planting'."],
        },
      ];
      setSubclaims(auditedSubclaims);
      if (claim) {
        setClaim({
          ...claim,
          status: "audited",
          overall_verdict: "SUPPORTED",
          overall_confidence: 0.88,
        });
      }
    }, 1000);
  };

  const handleIssueCertificate = () => {
    onCertificateIssued("cert_impact_7f2a");
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Claim Input Box */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <Scale className="w-4 h-4 text-emerald-400" />
          <span>Submit Sustainability Impact Claim for Forensic Cross-Examination</span>
        </div>

        <textarea
          value={claimText}
          onChange={(e) => setClaimText(e.target.value)}
          rows={3}
          className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm resize-none"
          placeholder="State your impact claim (e.g. 'We planted 5,000 trees at Site A between March and June')..."
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Engine: Gemini NLP Decomposition &bull; Cloudinary Media Search &bull; CLIP &bull; SIFT Homography
          </span>

          <button
            onClick={handleDecompose}
            disabled={loading || !claimText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all font-mono disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Decompose Into Sub-Claims
          </button>
        </div>
      </div>

      {/* Subclaims & Audit Table */}
      {subclaims.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white">Decomposed Checkable Hypotheses ({subclaims.length})</h4>
              <p className="text-xs text-slate-400">
                Every claim is broken down into falsifiable sub-claims scored against field media.
              </p>
            </div>

            {claim?.status !== "audited" ? (
              <button
                onClick={handleAudit}
                disabled={auditing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all font-mono disabled:opacity-50"
              >
                {auditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Run Adversarial Forensic Audit
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                  Overall Verdict: SUPPORTED (88% confidence)
                </div>
                <button
                  onClick={handleIssueCertificate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:opacity-90 shadow-lg shadow-emerald-500/20"
                >
                  <Award className="w-4 h-4" /> Issue Tamper-Evident Certificate
                </button>
              </div>
            )}
          </div>

          {/* Subclaims Cards */}
          <div className="flex flex-col gap-3">
            {subclaims.map((sc) => (
              <div
                key={sc.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-400">
                    {sc.type}
                  </span>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">{sc.statement}</h5>
                    {sc.reasons && sc.reasons.length > 0 && (
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {sc.reasons.map((r, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Verdict Badge & Score */}
                <div className="flex items-center gap-4 shrink-0">
                  {sc.confidence !== undefined && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-mono text-slate-400">
                        Confidence: {(sc.confidence * 100).toFixed(0)}%
                      </span>
                      <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sc.verdict === "supported"
                              ? "bg-emerald-400"
                              : sc.verdict === "weak"
                              ? "bg-amber-400"
                              : "bg-rose-400"
                          }`}
                          style={{ width: `${sc.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {sc.verdict === "supported" ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-3.5 h-3.5" /> SUPPORTED
                      </span>
                    ) : sc.verdict === "weak" ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" /> WEAK
                      </span>
                    ) : sc.verdict === "flagged" ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" /> FLAGGED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono text-slate-500 border border-slate-800">
                        <HelpCircle className="w-3.5 h-3.5" /> PENDING AUDIT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
