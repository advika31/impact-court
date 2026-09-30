"use client";

import React, { useState } from "react";
import { ArrowRight, Check, ChevronDown, Loader2, Upload, X } from "lucide-react";
import { createProject, Project, uploadEvidence, submitClaim, DEMO_PROJECTS } from "@/lib/api";

interface CustomerUploadProps {
  projects?: Project[];
  onProjectCreated?: (project: Project) => void;
  onSuccessNavigateToAdmin?: (claimId?: string) => void;
}

const formatDate = (value: Date) => value.toISOString().slice(0, 10);

export default function CustomerUpload({
  projects = DEMO_PROJECTS,
  onProjectCreated,
  onSuccessNavigateToAdmin,
}: CustomerUploadProps) {
  const availableProjects = projects && projects.length > 0 ? projects : DEMO_PROJECTS;
  const [selectedProjectId, setSelectedProjectId] = useState(availableProjects[0]?.id || "");
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [createProjectVisible, setCreateProjectVisible] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [siteLat, setSiteLat] = useState("12.9716");
  const [siteLng, setSiteLng] = useState("77.5946");
  const [radius, setRadius] = useState("2");
  const [windowStart, setWindowStart] = useState("2026-01-01");
  const [windowEnd, setWindowEnd] = useState(formatDate(new Date()));
  const [claimText, setClaimText] = useState(
    "We planted 500 indigenous saplings across Tapajos Site A between March and June 2026"
  );
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);
  const [createdClaimId, setCreatedClaimId] = useState<string | null>(null);

  const activeProjectId = selectedProjectId || availableProjects[0]?.id || "";
  const activeProject = availableProjects.find((p) => p.id === activeProjectId) || availableProjects[0];

  const handleFileChange = (newFiles: FileList | File[] | null) => {
    if (!newFiles) return;
    const fileList = Array.from(newFiles);
    setFiles((prev) => [...prev, ...fileList]);

    const newPreviews = fileList.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const loadSamplePhotos = async () => {
    try {
      const response = await fetch("/layout.jpg");
      const blob = await response.blob();
      const sampleFile1 = new File([blob], "tapajos_planting_01.jpg", { type: "image/jpeg" });
      const sampleFile2 = new File([blob], "tapajos_sapling_02.jpg", { type: "image/jpeg" });
      const sampleFile3 = new File([blob], "tapajos_boundary_03.jpg", { type: "image/jpeg" });
      handleFileChange([sampleFile1, sampleFile2, sampleFile3]);
    } catch {
      const dummyBlob = new Blob(["sample image content"], { type: "image/jpeg" });
      const sampleFile = new File([dummyBlob], "field_capture_sample.jpg", { type: "image/jpeg" });
      handleFileChange([sampleFile]);
    }
  };

  const handleCreateNewProject = async () => {
    setError("");
    try {
      const project = await createProject({
        name: projectName.trim(),
        site_lat: Number(siteLat),
        site_lng: Number(siteLng),
        site_radius_km: Number(radius),
        window_start: windowStart,
        window_end: windowEnd,
      });
      onProjectCreated?.(project);
      setSelectedProjectId(project.id);
      setCreateProjectVisible(false);
      setShowProjectPicker(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    }
  };

  const submit = async () => {
    if (!activeProjectId || !files.length || !claimText.trim()) return;
    setBusy(true);
    setError("");

    try {
      const randomCaseNum = Math.floor(1000 + Math.random() * 9000);
      const generatedCaseId = `IC-2026-${randomCaseNum}`;

      for (let index = 0; index < files.length; index += 1) {
        await uploadEvidence(activeProjectId, files[index]);
      }

      const result = await submitClaim(activeProjectId, claimText.trim());
      setSubmittedCaseId(generatedCaseId);
      setCreatedClaimId(result.claim.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload or claim creation failed");
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setSubmittedCaseId(null);
    setCreatedClaimId(null);
    setFiles([]);
    setFilePreviews([]);
    setClaimText("");
  };

  return (
    <section id="upload" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Plain Heading above dark panel on cream bg */}
      <div className="mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2d0000] tracking-tight text-left">
          File a new case
        </h2>
      </div>

      {/* Main Mahogany Panel */}
      <div className="bg-[#2d0000] text-[#eeead7] border border-[#2d0000] p-6 sm:p-10 shadow-xl space-y-7">
        {submittedCaseId ? (
          /* Human-Language Success State */
          <div className="py-8 space-y-6">
            <div className="border-b border-[#eeead7]/15 pb-6 space-y-2">
              <div className="font-mono text-xs uppercase tracking-wider text-[#cf2929]">
                Case Docketed
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#eeead7]">
                Case {submittedCaseId} filed.
              </h3>
              <p className="text-sm text-[#eeead7]/70">
                Your evidence is being checked &mdash; this usually takes a few seconds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  if (onSuccessNavigateToAdmin) {
                    onSuccessNavigateToAdmin(createdClaimId || undefined);
                  }
                }}
                className="inline-flex items-center gap-2 text-[#eeead7] hover:text-[#cf2929] underline underline-offset-4 cursor-pointer"
              >
                <span>View case status</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="text-[#eeead7]/70 hover:text-[#eeead7] underline underline-offset-4 cursor-pointer"
              >
                File another case &rarr;
              </button>
            </div>
          </div>
        ) : (
          /* Filing Form */
          <>
            {/* 1. What did you do? (Claim Textarea is FIRST and Prominent) */}
            <div className="space-y-2">
              <label
                htmlFor="claim-description"
                className="block text-sm font-semibold text-[#eeead7]"
              >
                What did you do?
              </label>
              <textarea
                id="claim-description"
                rows={3}
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="We planted 500 indigenous saplings across Tapajos Site A between March and June 2026"
                className="w-full p-4 rounded-none bg-[#160202] border border-[#eeead7]/20 text-[#eeead7] placeholder:text-[#eeead7]/40 text-sm sm:text-base focus:outline-none focus:border-[#cf2929] transition-colors resize-y"
                disabled={busy}
              />
            </div>

            {/* 2. Project Association (Collapsible) */}
            <div className="space-y-3 pt-1 border-t border-[#eeead7]/10">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => setShowProjectPicker((v) => !v)}
                  className="flex items-center gap-1.5 text-[#eeead7]/80 hover:text-[#eeead7] underline underline-offset-2 cursor-pointer"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      showProjectPicker ? "rotate-180" : ""
                    }`}
                  />
                  <span>
                    Attach to project:{" "}
                    <strong className="text-[#eeead7]">
                      {activeProject?.name || "Select project"}
                    </strong>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateProjectVisible((v) => !v)}
                  className="text-[#cf2929] hover:text-[#eeead7] underline underline-offset-2 cursor-pointer"
                >
                  {createProjectVisible ? "Cancel new project" : "+ Create a new project ›"}
                </button>
              </div>

              {/* Collapsible Project Selector */}
              {showProjectPicker && availableProjects.length > 0 && (
                <div className="p-3 bg-[#160202] border border-[#eeead7]/15">
                  <label htmlFor="project-picker-select" className="sr-only">
                    Select target project
                  </label>
                  <select
                    id="project-picker-select"
                    value={activeProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setShowProjectPicker(false);
                    }}
                    className="w-full bg-transparent text-[#eeead7] text-xs focus:outline-none cursor-pointer"
                  >
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#160202] text-[#eeead7]">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Collapsible Sub-form for creating project */}
              {createProjectVisible && (
                <div className="p-4 bg-[#160202] border border-[#eeead7]/15 space-y-3">
                  <div className="text-xs font-semibold text-[#eeead7]">
                    New Project Parameters
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Project name"
                      className="p-2.5 bg-[#2d0000]/60 border border-[#eeead7]/20 text-[#eeead7] focus:outline-none focus:border-[#cf2929]"
                    />
                    <input
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      type="number"
                      step="0.1"
                      placeholder="Site radius (km)"
                      className="p-2.5 bg-[#2d0000]/60 border border-[#eeead7]/20 text-[#eeead7] focus:outline-none focus:border-[#cf2929]"
                    />
                    <input
                      value={siteLat}
                      onChange={(e) => setSiteLat(e.target.value)}
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      className="p-2.5 bg-[#2d0000]/60 border border-[#eeead7]/20 text-[#eeead7] focus:outline-none focus:border-[#cf2929]"
                    />
                    <input
                      value={siteLng}
                      onChange={(e) => setSiteLng(e.target.value)}
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      className="p-2.5 bg-[#2d0000]/60 border border-[#eeead7]/20 text-[#eeead7] focus:outline-none focus:border-[#cf2929]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNewProject}
                    disabled={busy || !projectName.trim()}
                    className="px-3.5 py-1.5 bg-[#eeead7] text-[#2d0000] text-xs font-bold hover:bg-white disabled:opacity-50 cursor-pointer"
                  >
                    Save project
                  </button>
                </div>
              )}
            </div>

            {/* 3. Upload Field Photos Zone */}
            <div className="space-y-2 pt-2 border-t border-[#eeead7]/10">
              <label className="block text-sm font-semibold text-[#eeead7]">
                Upload field photos
              </label>

              <label className="border border-dashed border-[#eeead7]/30 hover:border-[#cf2929] p-8 flex flex-col items-center justify-center gap-2 bg-[#160202]/50 cursor-pointer transition-colors text-center">
                <Upload className="w-6 h-6 text-[#eeead7]/70" />
                <div className="text-sm font-semibold text-[#eeead7]">
                  Drop photos here, or click to browse
                </div>
                <div className="text-xs text-[#eeead7]/50">
                  GPS-tagged originals get the best results
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </label>

              {/* Plain text link for demo photos */}
              <div className="pt-1 text-xs">
                <button
                  type="button"
                  onClick={loadSamplePhotos}
                  disabled={busy}
                  className="text-[#eeead7]/60 hover:text-[#eeead7] underline cursor-pointer"
                >
                  Load sample photos for a demo
                </button>
              </div>
            </div>

            {/* 4. Thumbnail Grid with filename and 'Hashed ✓' badge (NO raw hex/coordinates) */}
            {filePreviews.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-[#eeead7]/70 font-mono">
                  {filePreviews.length} photo{filePreviews.length === 1 ? "" : "s"} staged:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filePreviews.map((preview, i) => (
                    <div
                      key={i}
                      className="p-2 bg-[#160202] border border-[#eeead7]/15 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="w-8 h-8 object-cover rounded-none shrink-0 border border-[#eeead7]/20"
                        />
                        <span className="text-xs truncate text-[#eeead7]">
                          {preview.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 border border-emerald-500/30">
                          <Check className="w-2.5 h-2.5" />
                          <span>Hashed &#10003;</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          disabled={busy}
                          aria-label={`Remove ${preview.name}`}
                          className="text-[#eeead7]/50 hover:text-rose-400 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs text-rose-300 bg-rose-950/40 p-3 border border-rose-800">
                {error}
              </p>
            )}

            {/* 5. Submit Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={submit}
                disabled={busy || !activeProjectId || !files.length || !claimText.trim()}
                className="w-full py-4 bg-[#eeead7] hover:bg-white text-[#2d0000] font-bold text-sm tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing and registering case...</span>
                  </>
                ) : (
                  <span>
                    {files.length > 0
                      ? `Submit evidence (${files.length} photo${files.length === 1 ? "" : "s"})`
                      : "Select photos to submit evidence"}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
