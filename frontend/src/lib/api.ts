// src/lib/api.ts - API client for Impact Court FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Project {
  id: string;
  name: string;
  site_lat: number;
  site_lng: number;
  site_radius_km: number;
  window_start: string;
  window_end: string;
  created_at?: string;
}

export interface Asset {
  id: string;
  project_id: string;
  cloudinary_public_id: string;
  resource_type: string;
  sha256: string;
  phash?: string;
  capture_time?: string;
  lat?: number;
  lng?: number;
  exif_json?: any;
  activity_label?: string;
  activity_score?: number;
  tags?: string[];
  forensics_json?: {
    has_exif?: boolean;
    geo_check?: { distance_km?: number; within_site?: boolean };
    time_check?: { within_window?: boolean };
    duplicates?: Array<{ asset_id: string; project_id: string; similarity: number; kind: string }>;
    tamper?: { ela_score?: number; flags?: string[] };
    flags?: string[];
    hard_fail?: boolean;
    exif?: any;
  };
  created_at?: string;
}

export interface SubClaim {
  id: string;
  claim_id: string;
  type: "location" | "time" | "count" | "change" | "activity";
  statement: string;
  params_json?: any;
  verdict?: "supported" | "weak" | "flagged" | "contradicted" | "pending";
  confidence?: number;
  reasons?: string[];
}

export interface Claim {
  id: string;
  project_id: string;
  text: string;
  status: string;
  overall_verdict?: string;
  overall_confidence?: number;
  created_at?: string;
  subclaims?: SubClaim[];
}

export interface Comparison {
  id: string;
  before_asset_id: string;
  after_asset_id: string;
  alignment_score: number;
  class_delta_json: {
    vegetation?: number;
    waste?: number;
    water?: number;
    built?: number;
    road?: number;
  };
  transform_urls: string[];
}

export interface Certificate {
  certificate_id: string;
  claim_id: string;
  merkle_root: string;
  signature: string;
  public_key: string;
  leaves: Array<{ kind: string; sha256: string; [key: string]: any }>;
  proofs: Record<string, string>;
}

// Fallback demo data to guarantee bulletproof live demos even if backend DB is empty
export const DEMO_PROJECTS: Project[] = [
  {
    id: "proj_amazon_01",
    name: "Tapajos Agroforestry & Canopy Restoration",
    site_lat: -2.4382,
    site_lng: -54.7156,
    site_radius_km: 5.0,
    window_start: "2026-03-01",
    window_end: "2026-06-30",
  },
  {
    id: "proj_coastal_02",
    name: "Sundarbans Mangrove Cleanup & Barrier Rebuild",
    site_lat: 21.9497,
    site_lng: 89.1833,
    site_radius_km: 3.5,
    window_start: "2026-01-15",
    window_end: "2026-05-30",
  }
];

export const DEMO_ASSETS: Asset[] = [
  {
    id: "asset_001",
    project_id: "proj_amazon_01",
    cloudinary_public_id: "impact-court/demo/saplings_field_01",
    resource_type: "image",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    phash: "d1f48e3a2b1c900f",
    capture_time: "2026-04-12T09:45:00Z",
    lat: -2.4390,
    lng: -54.7142,
    activity_label: "tree_planting",
    activity_score: 0.96,
    tags: ["tree_planting", "sapling", "verified_geo"],
    forensics_json: {
      has_exif: true,
      geo_check: { distance_km: 0.18, within_site: true },
      time_check: { within_window: true },
      duplicates: [],
      tamper: { ela_score: 0.04, flags: [] },
      flags: [],
      hard_fail: false,
      exif: { camera_make: "Sony", camera_model: "ILCE-7M4", captured_at: "2026-04-12T09:45:00Z" }
    }
  },
  {
    id: "asset_002",
    project_id: "proj_amazon_01",
    cloudinary_public_id: "impact-court/demo/nursery_bed_02",
    resource_type: "image",
    sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    phash: "c2a19f801e2b4d99",
    capture_time: "2026-05-03T14:20:10Z",
    lat: -2.4375,
    lng: -54.7160,
    activity_label: "tree_planting",
    activity_score: 0.94,
    tags: ["tree_planting", "nursery"],
    forensics_json: {
      has_exif: true,
      geo_check: { distance_km: 0.22, within_site: true },
      time_check: { within_window: true },
      duplicates: [],
      tamper: { ela_score: 0.03, flags: [] },
      flags: [],
      hard_fail: false,
      exif: { camera_make: "Apple", camera_model: "iPhone 15 Pro", captured_at: "2026-05-03T14:20:10Z" }
    }
  },
  {
    id: "asset_003",
    project_id: "proj_amazon_01",
    cloudinary_public_id: "impact-court/demo/waste_cleared_site",
    resource_type: "image",
    sha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    phash: "a4c28f110b9911e3",
    capture_time: "2026-03-25T11:15:00Z",
    lat: -2.4385,
    lng: -54.7150,
    activity_label: "cleanup",
    activity_score: 0.91,
    tags: ["cleanup", "ground_prep"],
    forensics_json: {
      has_exif: true,
      geo_check: { distance_km: 0.05, within_site: true },
      time_check: { within_window: true },
      duplicates: [],
      tamper: { ela_score: 0.05, flags: [] },
      flags: [],
      hard_fail: false,
      exif: { camera_make: "Samsung", camera_model: "SM-S928B", captured_at: "2026-03-25T11:15:00Z" }
    }
  }
];

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE}/api/projects`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("Backend unavailable, using demo projects", err);
  }
  return DEMO_PROJECTS;
}

export async function createProject(project: Omit<Project, "id">): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function fetchAssets(projectId?: string, query?: string): Promise<Asset[]> {
  try {
    const params = new URLSearchParams();
    if (projectId) params.set("project_id", projectId);
    if (query) params.set("q", query);

    const res = await fetch(`${API_BASE}/api/assets?${params.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("Backend unavailable, using demo assets", err);
  }
  return projectId ? DEMO_ASSETS.filter(a => a.project_id === projectId) : DEMO_ASSETS;
}

export async function submitClaim(projectId: string, text: string): Promise<Claim> {
  const res = await fetch(`${API_BASE}/api/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, text }),
  });
  if (!res.ok) throw new Error("Failed to submit claim");
  return res.json();
}

export async function auditClaim(claimId: string): Promise<{ claim: Claim; subclaims: SubClaim[] }> {
  const res = await fetch(`${API_BASE}/api/claims/${claimId}/audit`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to audit claim");
  return res.json();
}

export async function issueCertificate(claimId: string): Promise<Certificate> {
  const res = await fetch(`${API_BASE}/api/claims/${claimId}/certificate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to issue certificate");
  return res.json();
}

export async function verifyCertificate(certificateId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/verify/${certificateId}`);
  if (!res.ok) throw new Error("Certificate not found");
  return res.json();
}

export async function compareAssets(beforeAssetId: string, afterAssetId: string): Promise<Comparison> {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ before_asset_id: beforeAssetId, after_asset_id: afterAssetId }),
  });
  if (!res.ok) throw new Error("Failed to compare assets");
  return res.json();
}

export async function redteamCheck(projectId: string, publicId: string): Promise<any> {
  const params = new URLSearchParams({ project_id: projectId, public_id: publicId });
  const res = await fetch(`${API_BASE}/api/redteam/check?${params.toString()}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Red team check failed");
  return res.json();
}
