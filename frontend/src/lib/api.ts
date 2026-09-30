const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

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
  capture_time?: string | null;
  lat?: number | null;
  lng?: number | null;
  exif_json?: Record<string, unknown> | null;
  activity_label?: string | null;
  activity_score?: number | null;
  tags?: string[] | null;
  count_json?: Record<string, unknown> | null;
  vision_json?: Record<string, unknown> | null;
  forensics_json?: {
    geo_check?: { distance_km?: number | null; within_site?: boolean | null };
    time_check?: { within_window?: boolean | null };
    duplicates?: Array<{ asset_id: string; project_id: string; similarity: number; kind: string }>;
    tamper?: { ela_score?: number; flags?: string[] };
    flags?: string[];
    hard_fail?: boolean;
    exif?: Record<string, unknown>;
  } | null;
  created_at?: string;
}

export interface SubClaim {
  id: string;
  claim_id: string;
  type: "location" | "time" | "count" | "change" | "activity";
  statement: string;
  params_json?: Record<string, unknown>;
  verdict?: "supported" | "weak" | "flagged" | "contradicted" | "pending";
  confidence?: number;
  reasons?: string[];
}

export interface Claim {
  id: string;
  project_id: string;
  text: string;
  status: string;
  overall_verdict?: string | null;
  overall_confidence?: number | null;
  created_at?: string;
  subclaims?: SubClaim[];
}

export interface ClaimCreation { claim: Claim; subclaims: SubClaim[] }
export interface Comparison {
  id: string;
  before_asset_id: string;
  after_asset_id: string;
  alignment_score: number | null;
  class_delta_json: Record<string, number> | null;
  transform_urls: string[];
  analysis_json?: Record<string, unknown>;
}
export interface Certificate {
  certificate_id: string;
  claim_id: string;
  merkle_root: string;
  signature: string;
  public_key: string;
  leaves: Array<{ kind: string; sha256?: string; [key: string]: unknown }>;
  proofs: Record<string, string>;
}
export interface AuditResult { claim: Claim; subclaims: SubClaim[] }
export interface Job { id: string; status: "queued" | "running" | "completed" | "failed"; result_json?: Record<string, unknown>; error?: string }
export interface RedTeamResult { verdict: string; report: Record<string, unknown> }
export interface ReportResult { report_id: string; status: string; download_url: string; size_bytes: number; social_cards: Array<{ asset_id: string; source_public_id: string; url: string }> }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, cache: "no-store" });
  } catch {
    throw new Error(`Could not reach the Impact Court API at ${API_BASE}. Start the API and check NEXT_PUBLIC_API_URL.`);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail || body?.message || `${response.status} ${response.statusText}`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return response.json() as Promise<T>;
}

export function apiUrl(path: string): string { return `${API_BASE}${path}`; }
export function cloudinaryUrl(publicId: string, resourceType = "image"): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return "";
  const encodedId = publicId.split("/").map(encodeURIComponent).join("/");
  return `https://res.cloudinary.com/${encodeURIComponent(cloud)}/${encodeURIComponent(resourceType)}/upload/${encodedId}`;
}

export async function fetchProjects(): Promise<Project[]> { return request<Project[]>("/api/projects"); }
export async function createProject(project: Omit<Project, "id" | "created_at">): Promise<Project> {
  return request<Project>("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(project) });
}
export async function fetchAssets(projectId: string, query?: string): Promise<Asset[]> {
  const params = new URLSearchParams({ project_id: projectId });
  if (query?.trim()) params.set("q", query.trim());
  return request<Asset[]>(`/api/assets?${params}`);
}
export async function submitClaim(projectId: string, text: string): Promise<ClaimCreation> {
  return request<ClaimCreation>("/api/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: projectId, text }) });
}
export async function fetchClaim(claimId: string): Promise<ClaimCreation> {
  return request<ClaimCreation>(`/api/claims/${encodeURIComponent(claimId)}`);
}
export async function auditClaim(claimId: string): Promise<AuditResult> {
  const queued = await request<{ job_id: string }>(`/api/claims/${encodeURIComponent(claimId)}/audit?async_mode=true`, { method: "POST" });
  const job = await waitForJob(queued.job_id);
  if (job.status !== "completed") throw new Error(job.error || "Claim audit failed");
  return fetchClaim(claimId);
}
export async function fetchClaimEvidence(claimId: string): Promise<Array<{ evidence: Record<string, unknown>; asset: Asset; subclaim_id: string; subclaim: string }>> {
  return request<Array<{ evidence: Record<string, unknown>; asset: Asset; subclaim_id: string; subclaim: string }>>(`/api/claims/${encodeURIComponent(claimId)}/evidence`);
}
export async function issueCertificate(claimId: string): Promise<Certificate> {
  return request<Certificate>(`/api/claims/${encodeURIComponent(claimId)}/certificate`, { method: "POST" });
}
export async function verifyCertificate(certificateId: string): Promise<{ certificate: Certificate; verification: { valid: boolean; failures: string[] } }> {
  return request<{ certificate: Certificate; verification: { valid: boolean; failures: string[] } }>(`/api/verify/${encodeURIComponent(certificateId)}`);
}
export async function compareAssets(beforeAssetId: string, afterAssetId: string): Promise<Comparison> {
  return request<Comparison>("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ before_asset_id: beforeAssetId, after_asset_id: afterAssetId }) });
}
export async function createReport(claimId: string): Promise<ReportResult> {
  return request<ReportResult>("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claim_id: claimId }) });
}
export async function redteamCheck(projectId: string, publicId: string): Promise<RedTeamResult> {
  const params = new URLSearchParams({ project_id: projectId, public_id: publicId });
  return request<RedTeamResult>(`/api/redteam/check?${params}`, { method: "POST" });
}

async function uploadFileToCloudinary(projectId: string, file: File): Promise<string> {
  const signature = await request<{ timestamp: number; signature: string; api_key: string; cloud_name: string; folder: string }>(`/api/upload-signature?project_id=${encodeURIComponent(projectId)}`);
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.api_key);
  form.append("timestamp", String(signature.timestamp));
  form.append("signature", signature.signature);
  form.append("folder", signature.folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`, { method: "POST", body: form });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || "Cloudinary upload failed");
  return result.public_id as string;
}
export async function uploadSuspectImage(projectId: string, file: File): Promise<string> {
  return uploadFileToCloudinary(projectId, file);
}

async function waitForJob(jobId: string): Promise<Job> {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const job = await request<Job>(`/api/jobs/${encodeURIComponent(jobId)}`);
    if (job.status === "completed" || job.status === "failed") return job;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("The server is still processing this item. Check the job status in the API docs.");
}

export async function uploadEvidence(projectId: string, file: File): Promise<Asset> {
  const publicId = await uploadFileToCloudinary(projectId, file);
  const result = await request<Asset | { job_id: string }>(`/api/assets/ingest?async_mode=true`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, public_id: publicId, resource_type: "image" }),
  });
  if (!("job_id" in result)) return result;
  const job = await waitForJob(result.job_id);
  if (job.status !== "completed") throw new Error(job.error || "Asset analysis failed");
  const assetId = job.result_json?.asset_id;
  if (typeof assetId !== "string") throw new Error("Ingestion completed without returning an asset ID");
  return request<Asset>(`/api/assets/${encodeURIComponent(assetId)}`);
}

export { API_BASE };
