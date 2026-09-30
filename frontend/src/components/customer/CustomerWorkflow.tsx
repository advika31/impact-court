"use client";

import React, { useState } from "react";
import { Camera, Eye, ShieldAlert, Award, ChevronRight, Info } from "lucide-react";

export default function CustomerWorkflow() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      title: "Upload & hash",
      tag: "Ingestion",
      desc: "You upload geotagged photos from the field. We extract GPS coordinates and timestamps from each photo's EXIF data, compute a SHA-256 hash of the raw bytes (so any later alteration is detectable), and store everything through Cloudinary.",
      icon: Camera,
      highlights: ["GPS and timestamp extracted from EXIF", "Each photo hashed for tamper detection", "Originals stored via Cloudinary"],
    },
    {
      num: "02",
      title: "Classify & measure",
      tag: "Vision",
      desc: "A vision model (OpenCLIP ViT-B/32) classifies each photo into one of five activity types: tree planting, cleanup, road work, water sanitation, or construction. For before/after pairs, we align them with feature matching and measure how much vegetation, waste, or built area changed.",
      icon: Eye,
      highlights: ["5 activity categories, scored by confidence", "Before/after alignment via feature matching", "Pixel-level change measurement"],
    },
    {
      num: "03",
      title: "Check for problems",
      tag: "Fraud detection",
      desc: "We actively try to disprove the claim. Has this photo been used in a different project? Are the GPS coordinates outside the declared site? Does the timestamp fall outside the project window? Is there evidence of image editing software in the metadata?",
      icon: ShieldAlert,
      highlights: ["Cross-project duplicate detection", "GPS perimeter check (within declared radius)", "Timestamp and editing metadata flags"],
    },
    {
      num: "04",
      title: "Sign & certify",
      tag: "Certificate",
      desc: "If the evidence holds up, we produce a certificate: a Merkle tree of every photo hash, model output, and verdict, digitally signed with an Ed25519 key. Anyone with the certificate link can re-verify it independently—changing even one byte of evidence would break the signature.",
      icon: Award,
      highlights: ["Merkle tree of all evidence hashes", "Ed25519 digital signature", "Public one-click re-verification"],
    },
  ];

  const active = steps[activeStep];
  const ActiveIcon = active.icon;

  return (
    <section id="workflow" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="max-w-2xl mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2d0000] tracking-tight">
          How verification works
        </h2>
        <p className="text-[#757d6f] mt-3 leading-relaxed">
          From upload to signed certificate in four steps. Each step runs automatically—a
          500-tree claim checked against 38 photos typically takes a few seconds.
        </p>
      </div>

      <div className="flex flex-col gap-16">
        {/* Step indicators */}
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-0">
          <div className="hidden sm:block absolute top-6 left-[calc(12.5%)] right-[calc(12.5%)] h-[2px] bg-[#2d0000]/10" />
          <div
            className="hidden sm:block absolute top-6 left-[calc(12.5%)] h-[2px] bg-[#6d0808] transition-all duration-500"
            style={{ width: `${(activeStep / 3) * 75}%` }}
          />

          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = activeStep === idx;
            const isPast = idx < activeStep;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className="relative z-10 flex sm:flex-col items-center gap-3 sm:gap-2 sm:flex-1 group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                    isActive
                      ? "bg-[#6d0808] border-[#6d0808] text-[#eeead7] scale-110 shadow-lg shadow-[#6d0808]/20"
                      : isPast
                      ? "bg-[#2d0000] border-[#2d0000] text-[#eeead7]"
                      : "bg-white border-[#2d0000]/15 text-[#2d0000]/40 group-hover:border-[#6d0808]/30"
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col sm:items-center">
                  <span className={`text-xs font-medium ${
                    isActive ? "text-[#2d0000]" : "text-[#2d0000]/50"
                  }`}>
                    {step.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detail Panel */}
        <div className="rounded-2xl bg-white/50 border border-[#2d0000]/8 p-7 sm:p-9 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            <div className="flex flex-col items-center gap-3 md:min-w-[140px]">
              <div className="w-16 h-16 rounded-2xl bg-[#6d0808] flex items-center justify-center text-[#eeead7]">
                <ActiveIcon className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-medium text-[#757d6f] uppercase tracking-wide">
                {active.tag}
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <h3 className="text-xl font-bold text-[#2d0000]">
                {active.title}
              </h3>
              <p className="text-[#757d6f] leading-relaxed text-[15px]">
                {active.desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {active.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-3.5 h-3.5 text-[#6d0808] shrink-0 mt-0.5" />
                    <span className="text-[#2d0000]/70">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* One disclaimer, here */}
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-[#2d0000]/4 border border-[#2d0000]/8 max-w-2xl">
          <Info className="w-4 h-4 text-[#757d6f] shrink-0 mt-0.5" />
          <p className="text-xs text-[#757d6f] leading-relaxed">
            Automated checks can miss things. Every ruling links to the raw photos and model outputs so you can judge the evidence yourself.
          </p>
        </div>
      </div>
    </section>
  );
}
