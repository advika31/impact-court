"use client";

import React from "react";
import { ArrowRight, Lock, TreePine, FileCheck } from "lucide-react";

interface CustomerHeroProps {
  onScrollToUpload: () => void;
  onScrollToWorkflow: () => void;
}

export default function CustomerHero({ onScrollToUpload, onScrollToWorkflow }: CustomerHeroProps) {
  return (
    <section className="relative pt-16 pb-24 px-4 sm:px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Subtle warm glow behind content */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#6d0808]/8 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2d0000] text-[#eeead7] text-xs font-semibold shadow-lg shadow-[#2d0000]/15">
          <span className="w-2 h-2 rounded-full bg-[#cf2929] animate-pulse" />
          <span>Impact claims, connected to their field evidence</span>
          <span className="text-[#eeead7]/50">&bull;</span>
          <span className="text-[#eeead7]/80">Cloudinary Media Intelligence</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#2d0000] tracking-tight leading-[1.08]">
          Prove Your Impact. <br />
          <span className="text-[#6d0808]">
            Defeat Greenwashing.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#757d6f] max-w-2xl leading-relaxed">
          Upload project images, run metadata and duplicate checks, analyze claims against matched evidence, and issue
          verifiable certificates and audit reports. Vision outputs are estimates and should be reviewed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onScrollToUpload}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#6d0808] hover:bg-[#850b0b] text-[#eeead7] font-bold text-sm transition-all duration-200 shadow-xl shadow-[#6d0808]/25 hover:scale-[1.02] hover:shadow-2xl"
          >
            <span>Upload Field Evidence</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onScrollToWorkflow}
            className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-white/60 hover:bg-white text-[#2d0000] border border-[#2d0000]/15 font-semibold text-sm transition-all duration-200 hover:border-[#2d0000]/30 backdrop-blur-sm"
          >
            <span>How Impact Court Works</span>
          </button>
        </div>

        {/* Three Metric Cards */}
        <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-3xl bg-white/50 border border-[#6d0808]/10 flex flex-col gap-2 backdrop-blur-sm hover:border-[#6d0808]/25 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
            <div className="flex items-center gap-2 text-xs font-mono text-[#757d6f] uppercase tracking-widest">
              <TreePine className="w-4 h-4 text-[#6d0808]" />
              <span>Forensic checks</span>
            </div>
            <span className="text-3xl font-extrabold text-[#2d0000] tracking-tight mt-1">EXIF + pHash</span>
            <span className="text-sm text-[#757d6f]">Location, time and reuse signals where available</span>
          </div>

          <div className="p-6 rounded-3xl bg-white/50 border border-[#6d0808]/10 flex flex-col gap-2 backdrop-blur-sm hover:border-[#6d0808]/25 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
            <div className="flex items-center gap-2 text-xs font-mono text-[#757d6f] uppercase tracking-widest">
              <Lock className="w-4 h-4 text-[#6d0808]" />
              <span>Cryptographic Ledger</span>
            </div>
            <span className="text-3xl font-extrabold text-[#2d0000] tracking-tight mt-1">Ed25519</span>
            <span className="text-sm text-[#757d6f]">Signed Merkle certificate verification</span>
          </div>

          <div className="p-6 rounded-3xl bg-white/50 border border-[#6d0808]/10 flex flex-col gap-2 backdrop-blur-sm hover:border-[#6d0808]/25 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
            <div className="flex items-center gap-2 text-xs font-mono text-[#757d6f] uppercase tracking-widest">
              <FileCheck className="w-4 h-4 text-[#6d0808]" />
              <span>Reports</span>
            </div>
            <span className="text-3xl font-extrabold text-[#2d0000] tracking-tight mt-1">PDF</span>
            <span className="text-sm text-[#757d6f]">Export the claim audit and evidence links</span>
          </div>
        </div>
      </div>
    </section>
  );
}
