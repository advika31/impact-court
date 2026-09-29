"use client";

import React, { useState } from "react";
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
  Sparkles,
  ExternalLink,
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

import { DEMO_PROJECTS, DEMO_ASSETS, Project } from "@/lib/api";

export default function Home() {
  const [viewMode, setViewMode] = useState<"customer" | "admin">("customer");
  const [selectedProject, setSelectedProject] = useState<Project>(DEMO_PROJECTS[0]);
  const [adminTab, setAdminTab] = useState<
    "overview" | "evidence" | "claim" | "compare" | "redteam" | "certificate" | "reports"
  >("overview");
  const [activeCertId, setActiveCertId] = useState<string>("cert_8f2a_tapajos");

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
                  value={selectedProject.id}
                  onChange={(e) => {
                    const p = DEMO_PROJECTS.find((proj) => proj.id === e.target.value);
                    if (p) setSelectedProject(p);
                  }}
                  className="bg-transparent text-[#eeead7] font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  {DEMO_PROJECTS.map((proj) => (
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
          <CustomerUpload onSuccessNavigateToAdmin={() => setViewMode("admin")} />
        </main>
      )}

      {/* ===== ADMIN VIEW (unchanged) ===== */}
      {!isCustomer && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
          {adminTab === "overview" && (
            <div className="flex flex-col gap-8">
              <ProjectOverview project={selectedProject} />
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#757d6f]">
                    Verified Field Evidence in Project Ledger
                  </h3>
                  <button
                    onClick={() => setAdminTab("evidence")}
                    className="text-xs text-[#cf2929] hover:underline font-mono"
                  >
                    View All in Vault &rarr;
                  </button>
                </div>
                <EvidenceVault assets={DEMO_ASSETS} />
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
              <EvidenceVault assets={DEMO_ASSETS} />
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
                projectId={selectedProject.id}
                onCertificateIssued={(certId) => {
                  setActiveCertId(certId);
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
                  SIFT / ORB feature matching calculates RANSAC homography. If aligned, SegFormer scene delta computes
                  exact percentage changes.
                </p>
              </div>
              <BeforeAfterSlider
                beforeUrl="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80"
                afterUrl="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80"
                overlayUrl="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80"
                alignmentScore={0.92}
                classDeltas={{ vegetation: 31.2, waste: -60.0, built: 4.5, water: 0.0 }}
              />
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
                  Public verification proof. Every asset hash, transformation URL, and verdict is bound to a signed
                  Merkle root.
                </p>
              </div>
              <CertificateVerifier
                certificateId={activeCertId}
                claimId="claim_tapajos_88"
                merkleRoot="8f2a99c01b4478d10b7a8c4390e1f77d612e55a8f430c9e0117a55cbbd8a4f10"
                signature="4a7b98d011fc5489e023ba78cc019a84eb7710c558da90327fbc990144a83311e98a54cd78a011"
                publicKey="ed25519:7a88cf109e2231ab78bc90014a55219e88d014bc"
                leaves={[
                  {
                    kind: "asset",
                    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    label: "saplings_field_01.jpg",
                  },
                  {
                    kind: "asset",
                    sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
                    label: "nursery_bed_02.jpg",
                  },
                  {
                    kind: "transformation",
                    sha256: "9a01cf881024bd7810e445acb71190bc44e10788aa90bc7711204855cf889901",
                    label: "cloudinary:w_1200,h_630,c_fill,l_badge",
                  },
                  {
                    kind: "model_output",
                    sha256: "1488da01192e44cb78a901ff8899ca11400287bc9011ea88440019da55cf77a1",
                    label: "Colab LogisticRegression (tree_planting: 96%)",
                  },
                  {
                    kind: "verdict",
                    sha256: "33ac88109f2201bc89a014eebc90117766551044bb7890cc1123547890aa11bc",
                    label: "sc1_supported_confidence_0.94",
                  },
                ]}
              />
            </div>
          )}

          {adminTab === "reports" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#eeead7]">Campaign Deliverables & Reports</h2>
                <p className="text-xs text-[#eeead7]/70 mt-1">
                  Visual reports and campaign-ready social cards generated via Cloudinary dynamic transformation URLs.
                </p>
              </div>
              <ReportSocialCards />
            </div>
          )}
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
            <span>OpenCLIP ViT-B/32</span>
            <span>&bull;</span>
            <span>Ed25519 Merkle Proofs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
