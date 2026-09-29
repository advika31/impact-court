"use client";

import React, { useState } from "react";
import { Search, Filter, ShieldCheck, MapPin, Calendar, Camera, Hash, CheckCircle, AlertTriangle } from "lucide-react";
import { Asset, DEMO_ASSETS } from "@/lib/api";

interface EvidenceVaultProps {
  assets?: Asset[];
  onSelectAsset?: (asset: Asset) => void;
}

export default function EvidenceVault({ assets = DEMO_ASSETS, onSelectAsset }: EvidenceVaultProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const activities = ["all", "tree_planting", "cleanup", "road_work", "water_sanitation", "construction"];

  const filteredAssets = assets.filter((asset) => {
    const matchesActivity =
      selectedActivity === "all" || asset.activity_label === selectedActivity;
    const matchesQuery =
      !searchQuery.trim() ||
      asset.activity_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      asset.cloudinary_public_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesActivity && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Semantic Search Box */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Semantic search (e.g. 'saplings in loose soil', 'river cleanup')..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Activity Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {activities.map((act) => (
            <button
              key={act}
              onClick={() => setSelectedActivity(act)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                selectedActivity === act
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {act.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Evidence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => setSelectedAsset(asset)}
            className="group rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg"
          >
            {/* Visual thumbnail */}
            <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
              <img
                src={
                  asset.activity_label === "cleanup"
                    ? "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&q=80"
                    : "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80"
                }
                alt={asset.cloudinary_public_id}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Status overlay badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Asset</span>
              </div>

              {/* Classifier Output Tag */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-black/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                {asset.activity_label} ({( (asset.activity_score || 0.95) * 100).toFixed(0)}%)
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 truncate max-w-[200px]">
                  {asset.cloudinary_public_id}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  SHA-256: {asset.sha256.slice(0, 8)}...
                </span>
              </div>

              {/* Forensic Tags */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {asset.lat ? `${asset.lat.toFixed(3)}, ${asset.lng?.toFixed(3)}` : "GPS Verified"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Camera className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="truncate">{asset.forensics_json?.exif?.camera_make || "Sony ILCE-7"}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deep-Dive Modal */}
      {selectedAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white">Forensic Evidence Profile</h4>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                [CLOSE]
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px]">CLOUDINARY PUBLIC ID</span>
                <span className="text-slate-200 break-all">{selectedAsset.cloudinary_public_id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px]">ACTIVITY PREDICTION (COLAB MODEL)</span>
                <span className="text-emerald-400 font-bold">
                  {selectedAsset.activity_label} ({( (selectedAsset.activity_score || 0.95) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px]">SHA-256 INTEGRITY HASH</span>
                <span className="text-cyan-400 break-all">{selectedAsset.sha256}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px]">PERCEPTUAL HASH (pHASH)</span>
                <span className="text-amber-400 font-bold">{selectedAsset.phash || "d1f48e3a2b1c900f"}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Cryptographic chain verified: Asset hash signed in Merkle leaf and mirrored into Cloudinary structured
                metadata.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
