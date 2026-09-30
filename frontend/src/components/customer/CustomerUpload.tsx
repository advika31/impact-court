"use client";

import React, { useState } from "react";
import { ArrowRight, FileCheck, Loader2, UploadCloud } from "lucide-react";
import { createProject, Project, uploadEvidence, submitClaim } from "@/lib/api";

interface Props {
  projects: Project[];
  onProjectCreated: (project: Project) => void;
  onSuccessNavigateToAdmin?: (claimId: string) => void;
}

const date = (value: Date) => value.toISOString().slice(0, 10);

export default function CustomerUpload({ projects, onProjectCreated, onSuccessNavigateToAdmin }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [createProjectVisible, setCreateProjectVisible] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [siteLat, setSiteLat] = useState("12.9716");
  const [siteLng, setSiteLng] = useState("77.5946");
  const [radius, setRadius] = useState("2");
  const [windowStart, setWindowStart] = useState("2026-01-01");
  const [windowEnd, setWindowEnd] = useState(date(new Date()));
  const [claimText, setClaimText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeProjectId = selectedProjectId || projects[0]?.id || "";

  const createNewProject = async () => {
    setError("");
    try {
      const project = await createProject({
        name: projectName.trim(), site_lat: Number(siteLat), site_lng: Number(siteLng),
        site_radius_km: Number(radius), window_start: windowStart, window_end: windowEnd,
      });
      onProjectCreated(project);
      setSelectedProjectId(project.id);
      setCreateProjectVisible(false);
      setMessage(`Project “${project.name}” created.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create project"); }
  };

  const submit = async () => {
    if (!activeProjectId || !files.length || !claimText.trim()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const uploaded: string[] = [];
      for (let index = 0; index < files.length; index += 1) {
        setMessage(`Uploading and analyzing ${index + 1} of ${files.length}: ${files[index].name}`);
        const asset = await uploadEvidence(activeProjectId, files[index]);
        uploaded.push(asset.id);
      }
      setMessage("Creating claim from the uploaded evidence…");
      const result = await submitClaim(activeProjectId, claimText.trim());
      setMessage(`${uploaded.length} asset(s) ingested. Claim decomposed into ${result.subclaims.length} checkable item(s).`);
      setFiles([]);
      onSuccessNavigateToAdmin?.(result.claim.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload or claim creation failed");
    } finally { setBusy(false); }
  };

  return (
    <section id="upload" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3 text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#6d0808] font-semibold">Submit Field Evidence</span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#2d0000] tracking-tight">Register Media and an Impact Claim</h2>
        <p className="text-sm sm:text-base text-[#757d6f]">Images upload directly to Cloudinary using a server-signed request. The API then analyzes each image and stores its evidence record.</p>
      </div>

      <div className="max-w-4xl mx-auto rounded-3xl bg-[#2d0000] border border-[#6d0808]/20 p-6 sm:p-10 shadow-2xl flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2 text-xs text-[#eeead7]/70">Project
            <select value={activeProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7]" disabled={!projects.length || busy}>
              <option value="">Choose a project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs text-[#eeead7]/70">Impact claim
            <input value={claimText} onChange={(e) => setClaimText(e.target.value)} placeholder="We planted 500 trees at Site A this spring…" className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7]" disabled={busy} />
          </label>
        </div>

        {!!projects.length && <button type="button" onClick={() => setCreateProjectVisible((visible) => !visible)} className="self-start text-xs text-[#eeead7] underline underline-offset-4">{createProjectVisible ? "Cancel new project" : "Create another project"}</button>}

        {(!projects.length || createProjectVisible) && <div className="rounded-2xl border border-[#eeead7]/15 p-4 flex flex-col gap-4">
          <p className="text-sm font-semibold text-[#eeead7]">Create a project</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7]" />
            <input value={radius} onChange={(e) => setRadius(e.target.value)} type="number" min="0.1" step="0.1" aria-label="Site radius in km" placeholder="Site radius (km)" className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7]" />
            <input value={siteLat} onChange={(e) => setSiteLat(e.target.value)} type="number" step="any" aria-label="Site latitude" placeholder="Latitude" className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7]" />
            <input value={siteLng} onChange={(e) => setSiteLng(e.target.value)} type="number" step="any" aria-label="Site longitude" placeholder="Longitude" className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7]" />
            <label className="flex flex-col gap-1 text-xs text-[#eeead7]/60">Evidence window starts<input value={windowStart} onChange={(e) => setWindowStart(e.target.value)} type="date" className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7]" /></label>
            <label className="flex flex-col gap-1 text-xs text-[#eeead7]/60">Evidence window ends<input value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} type="date" className="p-3 rounded-xl bg-[#160202] border border-[#eeead7]/15 text-[#eeead7]" /></label>
          </div>
          <button type="button" onClick={createNewProject} disabled={busy || !projectName.trim()} className="px-4 py-2 rounded-xl bg-[#eeead7] text-[#2d0000] font-semibold disabled:opacity-40">Create project</button>
        </div>}

        <label className="border-2 border-dashed border-[#eeead7]/20 hover:border-[#6d0808] rounded-3xl p-8 flex flex-col items-center justify-center gap-3 bg-[#160202]/40 cursor-pointer">
          <UploadCloud className="w-8 h-8 text-[#eeead7]/70" />
          <span className="text-sm font-bold text-[#eeead7]">Choose field images</span>
          <span className="text-xs text-[#eeead7]/50">Original JPEG or PNG images recommended</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy || !activeProjectId} onChange={(e) => setFiles((current) => [...current, ...Array.from(e.target.files || [])])} />
        </label>

        {files.length > 0 && <div className="flex flex-wrap gap-2">{files.map((file, i) => <div key={`${file.name}-${i}`} className="rounded-lg bg-[#160202] px-3 py-2 text-xs text-[#eeead7] flex items-center gap-2">{file.name}<button type="button" onClick={() => setFiles((current) => current.filter((_, index) => index !== i))} disabled={busy} aria-label={`Remove ${file.name}`} className="text-rose-300">×</button></div>)}</div>}

        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        {message && <p role="status" className="text-sm text-[#eeead7]/80">{message}</p>}
        <button onClick={submit} disabled={busy || !activeProjectId || !files.length || !claimText.trim()} className="w-full py-4 rounded-2xl bg-[#eeead7] hover:bg-white disabled:opacity-40 text-[#2d0000] font-bold text-sm flex items-center justify-center gap-2">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading, analyzing and creating claim…</> : <><FileCheck className="w-4 h-4" /> Upload {files.length} image(s) and create claim <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </section>
  );
}
