"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  SlidersHorizontal,
  Award,
  Layers,
  FileText,
  Search,
  Scale,
  ShieldAlert,
  TreePine,
} from "lucide-react";

// Customer-Facing Components
import CustomerHero from "@/components/customer/CustomerHero";
import CustomerWorkflow from "@/components/customer/CustomerWorkflow";
import CustomerBetterment from "@/components/customer/CustomerBetterment";
import CustomerUpload from "@/components/customer/CustomerUpload";

// Admin / Auditor Components
import ProjectOverview from "@/components/ProjectOverview";
import EvidenceVault from "@/components/EvidenceVault";
import ClaimCourt from "@/components/ClaimCourt";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import RedTeamArena from "@/components/RedTeamArena";
import CertificateVerifier from "@/components/CertificateVerifier";
import ReportSocialCards from "@/components/ReportSocialCards";

import { Asset, Certificate, fetchAssets, fetchProjects, Project } from "@/lib/api";

export default function Home() {
  const [viewMode, setViewMode] = useState<"customer" | "admin">("customer");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [apiError, setApiError] = useState("");
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);
  const [adminTab, setAdminTab] = useState<
    "overview" | "evidence" | "claim" | "compare" | "redteam" | "certificate" | "reports"
  >("overview");
  useEffect(() => {
    fetchProjects().then((loaded) => {
      setProjects(loaded);
      setSelectedProject((current) => current || loaded[0] || null);
    }).catch((err) => setApiError(err instanceof Error ? err.message : "Could not load projects"));
  }, []);

  useEffect(() => {
    if (!selectedProject) { setAssets([]); return; }
    let cancelled = false;
    fetchAssets(selectedProject.id).then((items) => { if (!cancelled) setAssets(items); })
      .catch((err) => { if (!cancelled) setApiError(err instanceof Error ? err.message : "Could not load evidence"); });
    return () => { cancelled = true; };
  }, [selectedProject?.id]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const adminNavItems = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "evidence", label: "Evidence Vault", icon: Search },
    { id: "claim", label: "Claim Court", icon: Scale },
    { id: "compare", label: "Before & After", icon: SlidersHorizontal },
    { id: "redteam", label: "Red-Team Arena", icon: ShieldAlert, highlight: true },
    { id: "certificate", label: "Verification Proof", icon: Award },
    { id: "reports", label: "Campaign & Reports", icon: FileText },
  ];

  const isCustomer = viewMode === "customer";

  return (
    <div className={`min-h-screen flex flex-col font-sans ${
      isCustomer
        ? "bg-[#eeead7] text-[#2d0000] selection:bg-[#6d0808] selection:text-[#eeead7]"
        : "bg-[#160202] text-[#eeead7] selection:bg-[#6d0808] selection:text-[#eeead7]"
    }`}>
      {/* ===== HEADER / NAVIGATION ===== */}
      <header className={`sticky top-0 z-50 border-b ${
        isCustomer
          ? "bg-[#eeead7]/95 border-[#2d0000]/10 backdrop-blur-xl"
          : "bg-[#2d0000]/90 border-[#eeead7]/10 backdrop-blur-xl"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setViewMode("customer")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6d0808] to-[#cf2929] flex items-center justify-center text-[#eeead7] shadow-lg shadow-[#6d0808]/20 border border-[#6d0808]/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`font-extrabold text-lg tracking-tight ${
                  isCustomer ? "text-[#2d0000]" : "text-[#eeead7]"
                }`}>IMPACT COURT</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6d0808] text-[#eeead7] border border-[#6d0808]/30">
                  {isCustomer ? "PUBLIC PORTAL" : "ADMIN AUDITOR"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#757d6f]">
                AI-Powered Sustainability Media Auditor
              </span>
            </div>
          </div>

          {/* Customer Navigation Links */}
          {isCustomer && (
            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-[#2d0000]/70">
              <button
                onClick={() => scrollToSection("workflow")}
                className="hover:text-[#6d0808] transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("betterment")}
                className="hover:text-[#6d0808] transition-colors"
              >
                Impact & Betterment
              </button>
              <button
                onClick={() => scrollToSection("upload")}
                className="hover:text-[#6d0808] transition-colors"
              >
                Upload Evidence
              </button>
            </nav>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-3">
            {isCustomer ? (
              <button
                onClick={() => setViewMode("admin")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2d0000] hover:bg-[#3d0505] text-[#eeead7] font-bold text-xs transition-all shadow-lg shadow-[#2d0000]/20 hover:scale-[1.02]"
              >
                <span>Admin ML Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setViewMode("customer")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2d0000] hover:bg-[#3d0303] text-[#eeead7] border border-[#eeead7]/20 font-semibold text-xs transition-all"
              >
                <span>&larr; Back to Customer View</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Navigation Sub-Bar */}
        {!isCustomer && (
          <div className="border-t border-[#eeead7]/10 bg-[#1f0202]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = adminTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAdminTab(item.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                        isActive
                          ? "bg-[#6d0808] text-[#eeead7] border-[#eeead7]/30 shadow-md"
                          : item.highlight
                          ? "bg-[#2d0000] text-[#cf2929] border-[#cf2929]/30 hover:border-[#cf2929]"
                          : "bg-transparent text-[#eeead7]/60 border-transparent hover:text-[#eeead7] hover:bg-[#2d0000]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#2d0000] border border-[#eeead7]/15 text-xs text-[#eeead7]">
                <TreePine className="w-3.5 h-3.5 text-[#cf2929]" />
                <select
                  value={selectedProject?.id ?? ""}
                  onChange={(e) => {
                    setSelectedProject(projects.find((p) => p.id === e.target.value) || null);
                    setActiveClaimId(null);
                    setActiveCertificate(null);
                  }}
                  className="bg-transparent text-[#eeead7] font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id} className="bg-[#2d0000] text-[#eeead7]">
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ===== CUSTOMER VIEW ===== */}
      {isCustomer && (
        <main className="flex-1 flex flex-col">
          <CustomerHero
            onScrollToUpload={() => scrollToSection("upload")}
            onScrollToWorkflow={() => scrollToSection("workflow")}
          />
          <CustomerWorkflow />
          <div id="betterment">
            <CustomerBetterment />
          </div>
          <CustomerUpload
            projects={projects}
            onProjectCreated={(project) => { setProjects((current) => [project, ...current]); setSelectedProject(project); setApiError(""); }}
            onSuccessNavigateToAdmin={(claimId) => { setActiveClaimId(claimId); setAdminTab("claim"); setViewMode("admin"); }}
          />
        </main>
      )}

      {/* ===== ADMIN VIEW (unchanged) ===== */}
      {!isCustomer && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
          {apiError && <p role="alert" className="mb-5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">{apiError}</p>}
          {!selectedProject ? <div className="rounded-2xl border border-slate-700 p-8 text-slate-200">Create a project in the customer portal to start. The application is connected to the backend and does not show sample records.</div> : <>
          {adminTab === "overview" && (
            <div className="flex flex-col gap-8">
              <ProjectOverview project={selectedProject} assetCount={assets.length} />
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#757d6f]">
                    Ingested Field Evidence for This Project
                  </h3>
                  <button
                    onClick={() => setAdminTab("evidence")}
                    className="text-xs text-[#cf2929] hover:underline font-mono"
                  >
                    View All in Vault &rarr;
                  </button>
                </div>
                <EvidenceVault assets={assets} projectId={selectedProject.id} />
              </div>
            </div>
          )}

          {adminTab === "evidence" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#eeead7]">Media Evidence Vault</h2>
                <p className="text-xs text-[#eeead7]/70 mt-1">
                  Every image ingested through Cloudinary, hashed with SHA-256 and pHash, and classified by our
                  Colab-trained vision model.
                </p>
              </div>
              <EvidenceVault assets={assets} projectId={selectedProject.id} />
            </div>
          )}

          {adminTab === "claim" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#eeead7]">Claim Cross-Examination Court</h2>
                <p className="text-xs text-[#eeead7]/70 mt-1">
                  Adversarial verification testing: NLP breaks claims into checkable hypotheses and audits them against
                  visual ground truth.
                </p>
              </div>
              <ClaimCourt
                key={selectedProject.id}
                projectId={selectedProject.id}
                initialClaimId={activeClaimId}
                onClaimSelected={setActiveClaimId}
                onCertificateIssued={(certificate) => {
                  setActiveCertificate(certificate);
                  setAdminTab("certificate");
                }}
              />
            </div>
          )}

          {adminTab === "compare" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#eeead7]">Before & After Change Intelligence</h2>
                <p className="text-xs text-[#eeead7]/70 mt-1">
                    Choose two project assets to run the repository's alignment and vision comparison pipeline.
                </p>
              </div>
              <BeforeAfterSlider assets={assets} />
            </div>
          )}

          {adminTab === "redteam" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#cf2929]">Adversarial Red-Team Arena</h2>
                <p className="text-xs text-[#eeead7]/70 mt-1">
                  Interactive test bench for judges: drop suspect, reused, or doctored media and watch the forensic engine
                  dissect and flag it.
                </p>
              </div>
              <RedTeamArena projectId={selectedProject.id} />
            </div>
          )}

          {adminTab === "certificate" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#eeead7]">Cryptographic Certificate Viewer</h2>
                <p className="text-xs text-[#eeead7]/70 mt-1">
                  Verify the certificate signature and Merkle proofs issued by the backend.
                </p>
              </div>
              <CertificateVerifier
                certificate={activeCertificate}
              />
            </div>
          )}

          {adminTab === "reports" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#eeead7]">Campaign Deliverables & Reports</h2>
                <p className="text-xs text-[#eeead7]/70 mt-1">Generate and download an audit PDF from a claim and its persisted evidence.</p>
              </div>
              <ReportSocialCards claimId={activeClaimId} projectId={selectedProject.id} assets={assets} />
            </div>
          )}
          </>}
        </main>
      )}

      {/* ===== FOOTER ===== */}
      <footer className={`border-t py-8 text-center text-xs font-mono mt-auto ${
        isCustomer
          ? "bg-[#2d0000] border-[#2d0000] text-[#eeead7]/70"
          : "bg-[#160202] border-[#eeead7]/10 text-[#757d6f]"
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6d0808]" />
            <span className={`font-bold font-sans ${isCustomer ? "text-[#eeead7]" : "text-[#eeead7]/90"}`}>Impact Court</span>
            <span>&bull;</span>
            <span>Tamper-Evident Sustainability Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Cloudinary Media Engine</span>
            <span>&bull;</span>
            <span>Trained activity model</span>
            <span>&bull;</span>
            <span>Ed25519 Merkle Proofs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
