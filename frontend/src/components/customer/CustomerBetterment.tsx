"use client";

import React from "react";
import { Check, X, TrendingUp, Clock, Shield, FileCheck, Users } from "lucide-react";

export default function CustomerBetterment() {
  const impactMetrics = [
    {
      value: "EXIF",
      label: "Forensic context",
      desc: "Capture time, GPS, SHA-256 and perceptual hashes are collected when available",
    },
    {
      value: "ML",
      label: "Visual analysis",
      desc: "The configured vision services estimate activity, object counts and scene composition",
    },
    {
      value: "SHA-256",
      label: "Traceable evidence",
      desc: "Asset and analysis records can be included in signed Merkle certificates",
    },
    {
      value: "PDF",
      label: "Audit reports",
      desc: "Generate an exportable claim report from the claim, evidence links and certificate",
    },
  ];

  const comparisons = [
    {
      dimension: "Verification Speed",
      icon: Clock,
      legacy: "Manual review can require collecting records and coordinating site visits",
      ours: "Ingestion, claim audit and report generation are available in the app",
    },
    {
      dimension: "Fraud Defense",
      icon: Shield,
      legacy: "Reused or out-of-context photos may be difficult to identify consistently",
      ours: "Checks metadata, project boundaries and duplicate perceptual hashes; heuristics can miss manipulation",
    },
    {
      dimension: "Change Measurement",
      icon: TrendingUp,
      legacy: "Visual changes may be described without a recorded comparison result",
      ours: "The vision service returns an estimated alignment and scene delta for selected image pairs",
    },
    {
      dimension: "Proof of Authenticity",
      icon: FileCheck,
      legacy: "A standalone report does not necessarily include verifiable signatures",
      ours: "Ed25519-signed certificates can be re-verified by the API",
    },
    {
      dimension: "Public Auditability",
      icon: Users,
      legacy: "Auditors may need separate access to evidence and verification details",
      ours: "Certificate data and persisted evidence links are available for verification",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col gap-3 text-center max-w-3xl mx-auto mb-20">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#6d0808] font-semibold">
          Betterment & Impact
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#2d0000] tracking-tight">
          Measurable, Verifiable, Undeniable
        </h2>
        <p className="text-sm sm:text-base text-[#757d6f] mt-1">
          Model outputs are estimates. The interface connects each workflow to stored evidence and backend results.
        </p>
      </div>

      {/* ===== SWOT-Style Impact Circles with S-Curve ===== */}
      <div className="relative mb-24">
        {/* SVG S-Curve connector (desktop only) */}
        <svg
          className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1200 320"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M 150 160 C 300 40, 400 40, 450 160 C 500 280, 700 280, 750 160 C 800 40, 900 40, 1050 160"
            stroke="#6d0808"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.15"
          />
        </svg>

        {/* Circles Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {impactMetrics.map((metric, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-4">
              {/* Large Circle */}
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-[3px] border-[#6d0808]/25 bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-[#6d0808]/5 hover:border-[#6d0808]/50 hover:shadow-xl hover:shadow-[#6d0808]/10 transition-all duration-300 hover:scale-105">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#6d0808] tracking-tight font-mono">
                  {metric.value}
                </span>
              </div>
              {/* Label + Description */}
              <div className="flex flex-col gap-1 max-w-[220px]">
                <span className="text-sm font-bold text-[#2d0000] uppercase tracking-wide">
                  {metric.label}
                </span>
                <p className="text-xs text-[#757d6f] leading-relaxed">
                  {metric.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Two-Column Comparison (Not a table) ===== */}
      <div className="max-w-5xl mx-auto">
        {/* Column Headers */}
        <div className="grid grid-cols-12 gap-4 mb-6 px-4">
          <div className="col-span-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#757d6f] font-semibold">Dimension</span>
          </div>
          <div className="col-span-4 hidden md:block">
            <span className="text-xs font-mono uppercase tracking-widest text-[#6d0808]/60 font-semibold">Traditional Auditing</span>
          </div>
          <div className="col-span-4 hidden md:block">
            <span className="text-xs font-mono uppercase tracking-widest text-[#2d0000] font-bold">Impact Court</span>
          </div>
        </div>

        {/* Comparison Rows */}
        <div className="flex flex-col gap-3">
          {comparisons.map((row, idx) => {
            const Icon = row.icon;
            return (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl bg-white/50 border border-[#2d0000]/5 hover:border-[#6d0808]/20 hover:bg-white/70 transition-all items-center"
              >
                {/* Dimension */}
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#6d0808]/8 flex items-center justify-center text-[#6d0808] shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-bold text-[#2d0000]">{row.dimension}</span>
                </div>

                {/* Legacy */}
                <div className="md:col-span-4 flex items-start gap-2">
                  <X className="w-4 h-4 text-[#6d0808]/50 shrink-0 mt-0.5" />
                  <span className="text-xs text-[#757d6f]">{row.legacy}</span>
                </div>

                {/* Impact Court */}
                <div className="md:col-span-4 flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#2d0000] font-medium">{row.ours}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
