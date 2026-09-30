"use client";

import React from "react";
import { CheckCircle2, AlertOctagon } from "lucide-react";

export default function CustomerEvidence() {
  return (
    <section id="cases" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2d0000] tracking-tight text-left">
          Real cases from the docket
        </h2>
      </div>

      {/* Two columns, unequal widths (approx 60/40) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left (wider, 7 cols) — Supported Case */}
        <div className="lg:col-span-7 bg-[#f9f8f3] border border-[#2d0000]/20 rounded-none p-6 sm:p-8 text-[#2d0000]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2d0000]/15 pb-4 mb-5">
            <div>
              <span className="font-mono text-xs font-bold tracking-wider text-[#6d0808]">
                CASE IC-2026-0038
              </span>
              <h3 className="text-lg font-bold text-[#2d0000] mt-0.5">
                Case IC-2026-0038 &mdash; Supported
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-emerald-800/40 bg-emerald-50 text-emerald-900 font-mono text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>SUPPORTED</span>
            </div>
          </div>

          {/* Statement */}
          <div className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-wide text-[#757d6f] block mb-1">
              Filing Description
            </span>
            <p className="italic text-[#2d0000] font-serif text-sm border-l-2 border-[#6d0808]/30 pl-3">
              &ldquo;500 indigenous saplings planted at Tapajos Site A&rdquo;
            </p>
          </div>

          {/* Evidence Details */}
          <div className="space-y-3 text-xs sm:text-sm leading-relaxed border-t border-[#2d0000]/10 pt-4">
            <div className="font-mono font-semibold text-[#2d0000]">
              38 photos checked:
            </div>
            <ul className="space-y-2 pl-4 list-disc text-[#2d0000]/85 text-xs sm:text-sm">
              <li>
                <span className="font-mono">37 geotagged</span> within 2km of declared site
              </li>
              <li>
                <span className="font-mono">1 photo flagged:</span> GPS 14km outside perimeter
                <span className="text-[#757d6f] block sm:inline sm:ml-1">
                  (camera error, manually reviewed and accepted by auditor)
                </span>
              </li>
              <li>
                Activity classification: <span className="font-mono font-semibold">tree_planting</span> (96% avg confidence)
              </li>
              <li>No duplicate photos found in any other project</li>
              <li>
                Before/after segmentation: <span className="font-mono font-semibold text-[#6d0808]">+31.2%</span> vegetation cover
              </li>
            </ul>
          </div>

          {/* Footer Certificate Stamp */}
          <div className="mt-8 pt-4 border-t border-[#2d0000]/15 flex flex-wrap items-center justify-between text-xs font-mono text-[#757d6f] gap-2">
            <div>
              <span>Certificate: </span>
              <span className="text-[#2d0000] font-semibold">IC-2026-0038-CERT</span>
            </div>
            <div>
              <span>Signed: </span>
              <span className="text-[#2d0000]">2026-06-14T09:22:00Z</span>
            </div>
          </div>
        </div>

        {/* Right (narrower, 5 cols) — Flagged Case */}
        <div className="lg:col-span-5 bg-[#fbf9f4] border border-[#6d0808]/40 rounded-none p-6 sm:p-7 text-[#2d0000]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2d0000]/15 pb-4 mb-5">
            <div>
              <span className="font-mono text-xs font-bold tracking-wider text-[#6d0808]">
                CASE IC-2026-0091
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#2d0000] mt-0.5">
                Case IC-2026-0091 &mdash; Flagged
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[#6d0808] bg-rose-50 text-[#6d0808] font-mono text-[11px] font-bold">
              <AlertOctagon className="w-3.5 h-3.5 text-[#6d0808]" />
              <span>FLAGGED</span>
            </div>
          </div>

          {/* Statement */}
          <div className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-wide text-[#757d6f] block mb-1">
              Filing Description
            </span>
            <p className="italic text-[#2d0000] font-serif text-sm border-l-2 border-[#6d0808]/30 pl-3">
              &ldquo;200 mangrove saplings planted at Sundarbans Site B&rdquo;
            </p>
          </div>

          {/* Evidence Details */}
          <div className="space-y-3 text-xs sm:text-sm leading-relaxed border-t border-[#2d0000]/10 pt-4">
            <div className="font-mono font-semibold text-[#2d0000]">
              12 photos checked:
            </div>
            <ul className="space-y-2 pl-4 list-disc text-[#2d0000]/85 text-xs">
              <li>
                <strong className="text-[#6d0808]">4 photos matched</strong> existing records from a different project
                <span className="text-[#757d6f] block">
                  (Tapajos Site A, uploaded 3 months prior)
                </span>
              </li>
              <li>
                GPS coordinates: <strong className="text-[#6d0808]">6 of 12 outside</strong> declared site perimeter
              </li>
              <li>
                Activity classification: <span className="font-mono">cleanup (72%)</span>, not tree_planting
              </li>
            </ul>
          </div>

          {/* Ruling Box */}
          <div className="mt-6 p-4 border border-[#6d0808] bg-white space-y-1">
            <div className="font-mono text-xs font-bold text-[#6d0808] uppercase tracking-wider">
              Ruling: FLAGGED &mdash; evidence does not support claim
            </div>
            <div className="text-xs text-[#2d0000]/85">
              <span className="font-semibold">Reason:</span> Photo reuse from IC-2026-0038, GPS inconsistency
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
