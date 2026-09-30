"use client";

import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface CustomerHeroProps {
  onScrollToUpload: () => void;
  onScrollToWorkflow?: () => void;
  onScrollToCases?: () => void;
}

export default function CustomerHero({
  onScrollToUpload,
  onScrollToCases,
}: CustomerHeroProps) {
  return (
    <section className="pt-12 sm:pt-20 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Direct Single Statement & Action Links */}
        <div className="lg:col-span-7 flex flex-col items-start gap-8">
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-[#2d0000] tracking-tight leading-[1.15] text-left">
            Upload geotagged photos of a planting, cleanup, or construction.
            We check them against your claim and produce a signed report
            anyone can verify.
          </h1>

          <div className="flex flex-wrap items-center gap-8 pt-2 text-sm sm:text-base font-semibold">
            <button
              onClick={onScrollToUpload}
              className="inline-flex items-center gap-1.5 text-[#6d0808] hover:text-[#2d0000] underline underline-offset-4 transition-colors cursor-pointer group"
            >
              <span>Submit evidence</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>

            <button
              onClick={onScrollToCases || onScrollToUpload}
              className="inline-flex items-center gap-1.5 text-[#2d0000]/75 hover:text-[#2d0000] underline underline-offset-4 transition-colors cursor-pointer group"
            >
              <span>View a sample ruling</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>
        </div>

        {/* Right Column: Real Court Filing Case Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-[#f9f8f3] border border-[#2d0000]/20 rounded-none p-6 sm:p-7 shadow-sm text-[#2d0000]">
            {/* Document Header with Case ID */}
            <div className="flex items-start justify-between border-b border-[#2d0000]/15 pb-4 mb-5">
              <div>
                <div className="font-mono text-xs font-bold tracking-wider text-[#6d0808]">
                  CASE IC-2026-0038
                </div>
                <div className="text-sm font-semibold text-[#2d0000] mt-0.5">
                  Tapajos Agroforestry, Site A
                </div>
              </div>
              <span className="font-mono text-[11px] text-[#757d6f]">
                FILED: 2026-06-14
              </span>
            </div>

            {/* Claim Statement */}
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-[#757d6f] block mb-1">
                  Claim:
                </span>
                <p className="italic text-[#2d0000] font-serif border-l-2 border-[#6d0808]/30 pl-3">
                  &ldquo;500 saplings planted between March and June 2026&rdquo;
                </p>
              </div>

              {/* Evidence Checks */}
              <div className="pt-2 border-t border-[#2d0000]/10 space-y-1.5 text-xs text-[#2d0000]/85">
                <div className="flex justify-between font-mono">
                  <span className="text-[#757d6f]">Evidence:</span>
                  <span className="font-semibold">38 geotagged photos</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#757d6f]">Location check:</span>
                  <span className="font-semibold">37 of 38 within site</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#757d6f]">Activity match:</span>
                  <span className="font-semibold">tree_planting (96%)</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#757d6f]">Reuse flags:</span>
                  <span className="font-semibold text-emerald-800">None detected</span>
                </div>
              </div>

              {/* Court Ruling Box (Document Stamp Aesthetic) */}
              <div className="mt-5 p-3.5 border-2 border-[#2d0000] bg-white/70 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#6d0808]" />
                    <span className="font-mono text-xs font-bold tracking-wider text-[#2d0000]">
                      RULING: SUPPORTED
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-[#6d0808]">
                    Confidence: 0.94
                  </span>
                </div>
                <div className="font-mono text-[10px] text-[#757d6f] truncate mt-1">
                  Signed: ed25519:7a88cf...
                </div>
              </div>

              {/* Verify Link */}
              <div className="pt-4 flex justify-between items-center text-xs">
                <button
                  onClick={onScrollToCases}
                  className="font-semibold text-[#6d0808] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Verify this ruling</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] text-[#757d6f]">
                  Public Ledger Copy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
