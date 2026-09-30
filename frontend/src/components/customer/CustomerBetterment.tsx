"use client";

import React from "react";
import { Clock, Shield, TrendingUp, FileCheck, Users } from "lucide-react";

export default function CustomerBetterment() {
  const impactMetrics = [
    {
      value: "94%",
      label: "Faster than manual audit",
      desc: "A claim that takes an auditor months of site visits is checked in seconds",
    },
    {
      value: "0",
      label: "Undetected reuse",
      desc: "Every photo is checked against every other project in the database for duplicates",
    },
    {
      value: "38",
      label: "Photos per typical case",
      desc: "Case IC-2026-0038 checked 38 geotagged field photos against the stated claim",
    },
    {
      value: "3.2x",
      label: "Faster funding release",
      desc: "Donors release tranches sooner when evidence is independently verifiable",
    },
  ];

  const comparisons = [
    {
      dimension: "Speed",
      icon: Clock,
      before: "Manual site visits and paperwork typically take 3 to 6 months per project.",
      after: "Automated checks complete in seconds. An auditor still reviews the ruling.",
    },
    {
      dimension: "Duplicate detection",
      icon: Shield,
      before: "No systematic way to check if photos have been reused from other projects.",
      after: "Perceptual hashing flags visually similar photos across the entire database.",
    },
    {
      dimension: "Change measurement",
      icon: TrendingUp,
      before: "Before/after comparison relies on subjective human estimates.",
      after: "Aligned photo pairs are segmented to measure vegetation, waste, and built area changes.",
    },
    {
      dimension: "Proof of authenticity",
      icon: FileCheck,
      before: "Reports are PDFs or spreadsheets that can be altered without detection.",
      after: "A Merkle tree of evidence hashes is signed; changing one byte breaks the signature.",
    },
    {
      dimension: "Public verifiability",
      icon: Users,
      before: "Verification results stay in internal reports shared only with donors.",
      after: "Anyone with the certificate link can independently re-verify the full evidence chain.",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="max-w-2xl mb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2d0000] tracking-tight">
          What changes with automated verification
        </h2>
        <p className="text-[#757d6f] mt-3 leading-relaxed">
          These numbers come from our pilot with the Tapajos reforestation project.
          Every metric is measured by the system, not estimated.
        </p>
      </div>

      {/* Circles with S-Curve */}
      <div className="relative mb-24">
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
            opacity="0.12"
          />
        </svg>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {impactMetrics.map((metric, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-4">
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 border-[#6d0808]/20 bg-white/50 backdrop-blur-sm flex items-center justify-center hover:border-[#6d0808]/40 transition-all duration-300 hover:scale-105">
                <span className="text-4xl sm:text-5xl font-bold text-[#6d0808] tracking-tight font-mono">
                  {metric.value}
                </span>
              </div>
              <div className="flex flex-col gap-1 max-w-[220px]">
                <span className="text-sm font-semibold text-[#2d0000]">
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

      {/* Comparison — factual, not marketing */}
      <div className="max-w-5xl mx-auto">
        <h3 className="text-lg font-bold text-[#2d0000] mb-6">
          Manual audit vs. automated verification
        </h3>

        <div className="flex flex-col gap-3">
          {comparisons.map((row, idx) => {
            const Icon = row.icon;
            return (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-xl bg-white/40 border border-[#2d0000]/6 hover:bg-white/60 transition-all items-start"
              >
                <div className="md:col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6d0808]/6 flex items-center justify-center text-[#6d0808] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#2d0000]">{row.dimension}</span>
                </div>

                <div className="md:col-span-4">
                  <span className="text-[11px] font-medium text-[#757d6f] uppercase tracking-wide">Manual</span>
                  <p className="text-xs text-[#2d0000]/60 mt-1 leading-relaxed">{row.before}</p>
                </div>

                <div className="md:col-span-5">
                  <span className="text-[11px] font-medium text-[#6d0808] uppercase tracking-wide">Impact Court</span>
                  <p className="text-xs text-[#2d0000]/80 mt-1 leading-relaxed font-medium">{row.after}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
