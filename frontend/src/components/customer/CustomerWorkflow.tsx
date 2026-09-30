"use client";

import React, { useState } from "react";
import { Camera, Eye, ShieldAlert, Award, ChevronRight } from "lucide-react";

export default function CustomerWorkflow() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      title: "Field Capture & Ingestion",
      tag: "Cloudinary & SHA-256",
      desc: "Field officers capture photos directly from project sites. Impact Court extracts EXIF metadata, GPS coordinates, and camera serials, then computes SHA-256 byte hashes and perceptual hashes.",
      icon: Camera,
      highlights: ["Automatic EXIF GPS & timestamp parsing", "Deterministic SHA-256 registration", "Cloudinary metadata mirroring"],
    },
    {
      num: "02",
      title: "Vision ML Analysis",
      tag: "Gemini + trained classifier",
      desc: "The API uses Gemini for image interpretation and embeddings, and loads the repository activity classifier with its OpenCLIP encoder when the model is available. Before/after values are estimates.",
      icon: Eye,
      highlights: ["Vector-backed semantic search", "Trained activity classifier when loadable", "Estimated counts and scene changes"],
    },
    {
      num: "03",
      title: "Anti-Fraud Inspection",
      tag: "Red-Team Defense",
      desc: "The audit checks available capture metadata against a project's declared site and date window and looks for pHash duplicates. Missing or conflicting metadata is treated as a signal, not proof of fraud.",
      icon: ShieldAlert,
      highlights: ["Perceptual-hash duplicate candidates", "GPS and capture-window checks", "Forensic flags with stated limits"],
    },
    {
      num: "04",
      title: "Impact Certificate",
      tag: "Ed25519 Merkle Proof",
      desc: "Every asset hash, model output, and transformation URL is folded into a Merkle tree. The root is Ed25519 signed, producing a certificate anyone can re-verify in one click.",
      icon: Award,
      highlights: ["Zero-trust verification URL", "One-click re-verification", "1-byte change = cryptographic failure"],
    },
  ];

  const active = steps[activeStep];
  const ActiveIcon = active.icon;

  return (
    <section id="workflow" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col gap-3 text-center max-w-3xl mx-auto mb-20">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#6d0808] font-semibold">
          Transparent by Design
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#2d0000] tracking-tight">
          From Raw Photo to Verified Proof
        </h2>
        <p className="text-sm sm:text-base text-[#757d6f] mt-1">
          Follow each step from upload through analysis and signed certificate. Model estimates and forensic signals need human review.
        </p>
      </div>

      {/* Timeline Stepper */}
      <div className="flex flex-col gap-16">
        {/* Step indicators — horizontal on desktop, vertical on mobile */}
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-0">
          {/* Connecting line (desktop only) */}
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
                {/* Circle */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                    isActive
                      ? "bg-[#6d0808] border-[#6d0808] text-[#eeead7] scale-110 shadow-lg shadow-[#6d0808]/25"
                      : isPast
                      ? "bg-[#2d0000] border-[#2d0000] text-[#eeead7]"
                      : "bg-white border-[#2d0000]/20 text-[#2d0000]/50 group-hover:border-[#6d0808]/40"
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>
                {/* Step number + title */}
                <div className="flex flex-col sm:items-center">
                  <span className={`text-[10px] font-mono font-bold tracking-widest ${
                    isActive ? "text-[#6d0808]" : "text-[#757d6f]"
                  }`}>
                    STEP {step.num}
                  </span>
                  <span className={`text-xs font-bold mt-0.5 ${
                    isActive ? "text-[#2d0000]" : "text-[#2d0000]/60"
                  }`}>
                    {step.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detail Panel */}
        <div className="rounded-3xl bg-white/60 border border-[#6d0808]/10 p-8 sm:p-10 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            {/* Left: Icon + Tag */}
            <div className="flex flex-col items-center gap-3 md:min-w-[160px]">
              <div className="w-20 h-20 rounded-3xl bg-[#6d0808] flex items-center justify-center text-[#eeead7] shadow-lg shadow-[#6d0808]/20">
                <ActiveIcon className="w-9 h-9" />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-[#2d0000] text-[#eeead7]">
                {active.tag}
              </span>
            </div>

            {/* Right: Content */}
            <div className="flex-1 flex flex-col gap-5">
              <h3 className="text-2xl font-extrabold text-[#2d0000] tracking-tight">
                {active.title}
              </h3>
              <p className="text-[#757d6f] leading-relaxed">
                {active.desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {active.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-[#6d0808] shrink-0 mt-0.5" />
                    <span className="text-[#2d0000]/80 font-medium">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
