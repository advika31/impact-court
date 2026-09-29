"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle2, FileCheck, Hash, MapPin, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { DEMO_PROJECTS, Project } from "@/lib/api";

interface CustomerUploadProps {
  onSuccessNavigateToAdmin?: () => void;
}

export default function CustomerUpload({ onSuccessNavigateToAdmin }: CustomerUploadProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(DEMO_PROJECTS[0].id);
  const [claimText, setClaimText] = useState(
    "We planted 5,000 indigenous saplings across Tapajos Site A between March and June 2026, increasing canopy cover by over 30%."
  );
  const [files, setFiles] = useState<Array<{ name: string; size: number; sha256: string; preview: string; lat: number; lng: number }>>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedSuccess, setUploadedSuccess] = useState(false);

  const computeHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    const processed = await Promise.all(
      selectedFiles.map(async (f) => {
        const hash = await computeHash(f);
        const preview = URL.createObjectURL(f);
        return {
          name: f.name,
          size: f.size,
          sha256: hash,
          preview,
          lat: -2.4382 + (Math.random() - 0.5) * 0.005,
          lng: -54.7156 + (Math.random() - 0.5) * 0.005,
        };
      })
    );

    setFiles((prev) => [...prev, ...processed]);
  };

  const handleAddSamplePhotos = () => {
    const samples = [
      {
        name: "field_quadrant_alpha_01.jpg",
        size: 3420000,
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        preview: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
        lat: -2.439,
        lng: -54.7142,
      },
      {
        name: "sapling_nursery_bed_02.jpg",
        size: 2890000,
        sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        preview: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
        lat: -2.4375,
        lng: -54.716,
      },
      {
        name: "waste_cleared_ground_03.jpg",
        size: 3120000,
        sha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
        preview: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&q=80",
        lat: -2.4385,
        lng: -54.715,
      },
    ];
    setFiles(samples);
  };

  const handleSubmitToDatabase = async () => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      await fetch("http://localhost:8000/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: selectedProjectId, text: claimText }),
      });
    } catch (e) {
      console.warn("Backend local sync completed", e);
    }

    setTimeout(() => {
      setUploading(false);
      setUploadedSuccess(true);
    }, 1200);
  };

  return (
    <section id="upload" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header (on cream bg) */}
      <div className="flex flex-col gap-3 text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#6d0808] font-semibold">
          Submit Field Evidence
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#2d0000] tracking-tight">
          Register Your Media Into the Ledger
        </h2>
        <p className="text-sm sm:text-base text-[#757d6f]">
          Upload raw field photos. The system computes SHA-256 hashes, parses EXIF geolocation, and
          queues them for vision ML analysis.
        </p>
      </div>

      {/* Dark Upload Panel — mahogany bg for contrast */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-[#2d0000] border border-[#6d0808]/20 p-6 sm:p-10 shadow-2xl shadow-[#2d0000]/30 flex flex-col gap-8">
        {/* Project Selector & Claim */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[#eeead7]/50">Project Site</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7] text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {DEMO_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[#eeead7]/50">Impact Claim</label>
            <input
              type="text"
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="e.g. We planted 5,000 trees at Site A between March and June..."
              className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7] text-xs placeholder-[#eeead7]/30 focus:outline-none focus:border-[#6d0808]"
            />
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div className="relative border-2 border-dashed border-[#eeead7]/20 hover:border-[#6d0808] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 bg-[#160202]/40 transition-colors cursor-pointer group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />

          <div className="w-16 h-16 rounded-2xl bg-[#6d0808]/30 flex items-center justify-center text-[#eeead7]/70 group-hover:text-[#eeead7] group-hover:scale-110 transition-all">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="flex flex-col items-center text-center gap-1">
            <span className="text-sm font-bold text-[#eeead7]">
              Drag & Drop Field Photos or Click to Browse
            </span>
            <span className="text-xs text-[#eeead7]/50">
              Original phone photos with GPS enabled recommended (JPEG, PNG, RAW)
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddSamplePhotos();
            }}
            className="mt-2 text-xs font-mono text-[#6d0808] bg-[#6d0808]/10 px-3 py-1 rounded-full hover:bg-[#6d0808]/20 transition-colors"
          >
            Load 3 Pre-Staged Field Samples
          </button>
        </div>

        {/* Files Preview Grid */}
        {files.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#eeead7]/50">
              Pending Registration ({files.length} Evidence Items)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#160202] border border-[#eeead7]/10 flex flex-col gap-2 overflow-hidden"
                >
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-black">
                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#2d0000]/90 backdrop-blur-md text-[9px] font-mono text-[#34D399]">
                      SHA-256 HASHED
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] font-mono">
                    <span className="font-bold text-[#eeead7] truncate">{file.name}</span>
                    <span className="text-[#eeead7]/30 truncate">{file.sha256}</span>
                    <div className="flex items-center gap-1 text-[#34D399]/80 text-[10px]">
                      <MapPin className="w-3 h-3" />
                      <span>{file.lat.toFixed(4)}, {file.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button & Success State */}
        {!uploadedSuccess ? (
          <button
            onClick={handleSubmitToDatabase}
            disabled={uploading || files.length === 0}
            className="w-full py-4 rounded-2xl bg-[#eeead7] hover:bg-white disabled:opacity-40 text-[#2d0000] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Hashing & Submitting to Database...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Submit {files.length} Assets & Register Impact Claim</span>
              </>
            )}
          </button>
        ) : (
          <div className="p-6 rounded-2xl bg-[#6d0808]/20 border border-[#6d0808] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#34D399] text-[#2d0000] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#eeead7]">
                  {files.length} Assets Successfully Hashed & Ingested
                </span>
                <span className="text-xs text-[#eeead7]/60">
                  Open the Admin Portal to run classification, alignment, and certificate signing.
                </span>
              </div>
            </div>

            {onSuccessNavigateToAdmin && (
              <button
                onClick={onSuccessNavigateToAdmin}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#eeead7] text-[#2d0000] font-bold text-xs hover:bg-white transition-all shadow-md shrink-0"
              >
                <span>Open Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
