"use client";

import React from "react";
import { MapPin, Calendar, ShieldCheck } from "lucide-react";
import { Project } from "@/lib/api";

interface ProjectOverviewProps {
  project: Project;
  assetCount: number;
  onSelectProject?: (p: Project) => void;
}

export default function ProjectOverview({ project, assetCount }: ProjectOverviewProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hero Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Project Workspace
              </span>
              <span className="text-xs font-mono text-slate-500">{project.id}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>
                  Center: {project.site_lat.toFixed(4)}, {project.site_lng.toFixed(4)} ({project.site_radius_km} km radius)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>
                  Window: {project.window_start} &rarr; {project.window_end}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-500">Ingested Evidence</span>
              <span className="text-xl font-bold text-white mt-1">{assetCount}</span>
              <span className="text-[10px] text-slate-400 font-mono">Stored for this project</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-500">Project Radius</span>
              <span className="text-xl font-bold text-emerald-400 mt-1">{project.site_radius_km} km</span>
              <span className="text-[10px] text-slate-400 font-mono">Declared site boundary</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-mono text-slate-500">Evidence Window</span>
              <span className="text-xs font-bold text-cyan-400 mt-1">{project.window_start} – {project.window_end}</span>
              <span className="text-[10px] text-cyan-300/80 font-mono">Project settings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
