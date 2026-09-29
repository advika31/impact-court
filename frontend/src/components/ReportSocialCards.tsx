"use client";

import React from "react";
import { Share2, Download, ExternalLink, Image as ImageIcon, Sparkles, CheckCircle2 } from "lucide-react";

export default function ReportSocialCards() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Campaign-Ready Visuals & Dynamic Cloudinary Transformations</h3>
        </div>
        <p className="text-xs text-slate-400">
          Auto-generated public campaign assets powered by Cloudinary dynamic transformation URLs, stamped with
          cryptographic verification badges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Social Card 1: Verified Impact Badge Overlay */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden flex flex-col">
          <div className="relative h-64 w-full bg-slate-950 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80"
              alt="Social Card Banner"
              className="w-full h-full object-cover"
            />
            {/* Cloudinary dynamic badge overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold tracking-widest uppercase">IMPACT COURT</span>
                <span className="text-[9px] font-mono text-slate-400">CERTIFIED EVIDENCE</span>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 block">+31.2% CANOPY REGENERATION</span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                5,000 Indigenous Saplings Verified Across Tapajos Basin
              </h4>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between border-t border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Transformation: w_1200,h_630,c_fill,l_verified_badge</span>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>

        {/* Executive Audit Report Summary Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">OFFICIAL AUDIT REPORT</span>
            <h4 className="text-lg font-bold text-white">Verified Impact Disclosure Document (PDF)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete tamper-evident audit disclosure containing full cryptographic Merkle leaf paths, SIFT alignment
              matrices, SegFormer scene delta tables, and Ed25519 auditor signature.
            </p>

            <div className="flex flex-col gap-2 mt-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Evidence Items Hash-Locked:</span>
                <span className="text-slate-200">38 Assets</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Merkle Root:</span>
                <span className="text-emerald-400">8f2a99c01...d8a4</span>
              </div>
            </div>
          </div>

          <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20">
            <Download className="w-4 h-4" /> Download Certified Audit Report (.PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
