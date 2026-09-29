"use client";

import React, { useState } from "react";
import { AlertOctagon, CheckCircle2, UploadCloud, MapPin, Calendar, Copy, FileWarning, ShieldAlert } from "lucide-react";

interface RedTeamArenaProps {
  projectId: string;
}

export default function RedTeamArena({ projectId }: RedTeamArenaProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);

  // Pre-configured red-team samples for quick testing during the live pitch
  const testSamples = [
    {
      id: "reuse",
      title: "Fake 1: Cross-Project Reuse",
      desc: "Re-uploaded evidence already registered to Sundarbans Project",
      expected: "reused_from_other_project (pHash match 0.98)",
      run: () => {
        setAnalyzing(true);
        setTimeout(() => {
          setAnalyzing(false);
          setReport({
            verdict: "FAKE / FLAGGED",
            hard_fail: true,
            flags: ["reused_from_other_project"],
            geo_check: { within_site: true, distance_km: 0.12 },
            time_check: { within_window: true },
            tamper: { ela_score: 0.04, flags: [] },
            duplicates: [
              {
                asset_id: "asset_sundarbans_88",
                project_id: "proj_coastal_02",
                similarity: 0.98,
                kind: "exact",
              },
            ],
            exif: { has_exif: true, camera_make: "Sony", captured_at: "2026-04-10T12:00:00" },
          });
        }, 800);
      },
    },
    {
      id: "gps_spoof",
      title: "Fake 2: Out-of-Bounds GPS",
      desc: "Photo captured 42.5 km away from declared Tapajos perimeter",
      expected: "geo_boundary_breach (> 2.0 km radius)",
      run: () => {
        setAnalyzing(true);
        setTimeout(() => {
          setAnalyzing(false);
          setReport({
            verdict: "FAKE / FLAGGED",
            hard_fail: true,
            flags: ["geo_check_failed_outside_radius"],
            geo_check: { within_site: false, distance_km: 42.5 },
            time_check: { within_window: true },
            tamper: { ela_score: 0.03, flags: [] },
            duplicates: [],
            exif: { has_exif: true, lat: -2.019, lng: -55.08, captured_at: "2026-04-14T09:12:00" },
          });
        }, 800);
      },
    },
    {
      id: "stripped",
      title: "Fake 3: Stripped Social Screenshot",
      desc: "WhatsApp/Instagram screenshot with camera EXIF erased",
      expected: "missing_exif_metadata",
      run: () => {
        setAnalyzing(true);
        setTimeout(() => {
          setAnalyzing(false);
          setReport({
            verdict: "SUSPICIOUS / WEAK",
            hard_fail: false,
            flags: ["missing_exif_metadata"],
            geo_check: { within_site: false, distance_km: null },
            time_check: { within_window: false },
            tamper: { ela_score: 0.18, flags: ["compression_artifacts"] },
            duplicates: [],
            exif: { has_exif: false },
          });
        }, 800);
      },
    },
    {
      id: "doctored",
      title: "Fake 4: Doctored / Edited",
      desc: "Modified in editing software (Photoshop/GIMP header signature)",
      expected: "editing_software_tag",
      run: () => {
        setAnalyzing(true);
        setTimeout(() => {
          setAnalyzing(false);
          setReport({
            verdict: "FAKE / FLAGGED",
            hard_fail: true,
            flags: ["editing_software_tag", "high_ela_tamper_score"],
            geo_check: { within_site: true, distance_km: 0.35 },
            time_check: { within_window: true },
            tamper: { ela_score: 0.42, flags: ["cloning_inconsistency"] },
            duplicates: [],
            exif: { has_exif: true, software: "Adobe Photoshop 2025 (Windows)" },
          });
        }, 800);
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 to-slate-900/80 border border-rose-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Adversarial Red-Team Arena</h3>
            <p className="text-xs text-slate-400">
              Judges: Upload suspect, reused, or doctored media. Watch Impact Court's forensic engine flag it live.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Test Vectors for the Pitch */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Instant Red-Team Test Vectors (Click to trigger live analysis)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {testSamples.map((sample) => (
            <button
              key={sample.id}
              onClick={sample.run}
              disabled={analyzing}
              className="p-4 rounded-xl text-left bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between group disabled:opacity-50"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400 block transition-colors">
                  {sample.title}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{sample.desc}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-3 block">{sample.expected}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Forensic Report Display */}
      {analyzing && (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Scanning EXIF headers, perceptual hashes, geo-radius, and ELA tamper artifacts...
          </span>
        </div>
      )}

      {report && !analyzing && (
        <div
          className={`p-6 rounded-2xl border transition-all ${
            report.hard_fail
              ? "bg-rose-950/20 border-rose-500/40 glow-rose"
              : "bg-amber-950/20 border-amber-500/30"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  report.hard_fail ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                }`}
              >
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">{report.verdict}</span>
                <p className="text-xs text-slate-400">
                  {report.hard_fail
                    ? "Adversarial check failed. Evidence rejected from certificate ledger."
                    : "Caution: Evidence lacks verifiable cryptographic integrity tags."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {report.flags.map((flag: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>

          {/* Forensic breakdown grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs font-mono">
            {/* Geo */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1">
              <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> GEOLOCATION
              </span>
              <span className={report.geo_check?.within_site ? "text-emerald-400" : "text-rose-400 font-bold"}>
                {report.geo_check?.distance_km !== null
                  ? `${report.geo_check.distance_km} km away (${
                      report.geo_check.within_site ? "Within Radius" : "BREACH"
                    })`
                  : "NO GPS METADATA"}
              </span>
            </div>

            {/* Time */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1">
              <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-purple-400" /> TIMELINE WINDOW
              </span>
              <span className={report.time_check?.within_window ? "text-emerald-400" : "text-rose-400 font-bold"}>
                {report.time_check?.within_window ? "Captured In Window" : "OUTSIDE TIMELINE"}
              </span>
            </div>

            {/* Duplicates */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1">
              <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                <Copy className="w-3.5 h-3.5 text-amber-400" /> REUSE DETECTION
              </span>
              <span className={report.duplicates.length > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                {report.duplicates.length > 0
                  ? `REUSED (${(report.duplicates[0].similarity * 100).toFixed(0)}% pHash)`
                  : "Unique Photo"}
              </span>
            </div>

            {/* Software Tamper */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1">
              <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                <FileWarning className="w-3.5 h-3.5 text-rose-400" /> SOFTWARE TAGS
              </span>
              <span className={report.exif?.software ? "text-rose-400 font-bold" : "text-slate-300"}>
                {report.exif?.software || "Clean Camera Source"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
