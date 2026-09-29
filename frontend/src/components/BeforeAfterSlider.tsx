"use client";

import React, { useState, useRef } from "react";
import { SlidersHorizontal, Eye, Sparkles, CheckCircle2 } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  overlayUrl?: string;
  alignmentScore?: number;
  classDeltas?: {
    vegetation?: number;
    waste?: number;
    built?: number;
    water?: number;
    road?: number;
  };
}

export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  overlayUrl,
  alignmentScore = 0.94,
  classDeltas = { vegetation: 31.2, waste: -60.0 },
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [showOverlay, setShowOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPos(percent);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Metrics Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SIFT Homography Alignment: {(alignmentScore * 100).toFixed(0)}%
          </div>
          {classDeltas.vegetation !== undefined && (
            <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
              Vegetation {classDeltas.vegetation > 0 ? `+${classDeltas.vegetation}%` : `${classDeltas.vegetation}%`}
            </div>
          )}
          {classDeltas.waste !== undefined && (
            <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Waste {classDeltas.waste > 0 ? `+${classDeltas.waste}%` : `${classDeltas.waste}%`}
            </div>
          )}
        </div>

        {overlayUrl && (
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showOverlay
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showOverlay ? "Hide Change Heatmap" : "View OpenCV Difference Heatmap"}
          </button>
        )}
      </div>

      {/* Interactive Slider Frame */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[450px] md:h-[520px] rounded-2xl overflow-hidden cursor-ew-resize select-none border border-slate-800 shadow-2xl bg-black"
      >
        {/* Background: After Image (or Overlay) */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={showOverlay && overlayUrl ? overlayUrl : afterUrl}
            alt="After site state"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 px-3 py-1 rounded-md bg-black/70 backdrop-blur-md text-emerald-400 font-semibold text-xs border border-emerald-500/30">
            AFTER / REGENERATED
          </div>
        </div>

        {/* Foreground: Before Image (Clipped) */}
        <div
          className="absolute inset-0 h-full overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={beforeUrl}
            alt="Before site state"
            className="absolute top-0 left-0 w-full h-full object-cover max-w-none"
            style={{ width: containerRef.current?.clientWidth || "100%" }}
          />
          <div className="absolute bottom-4 left-4 px-3 py-1 rounded-md bg-black/70 backdrop-blur-md text-amber-300 font-semibold text-xs border border-amber-500/30">
            BEFORE / INITIAL
          </div>
        </div>

        {/* Divider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center shadow-xl">
            <SlidersHorizontal className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
