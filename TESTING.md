# Step-by-step testing guide

This guide tests the changes in the local checkout. API keys and a reachable
Cloudinary account are needed for the full image flow. Gemini calls may incur
usage charges, and visual counts/change measurements are estimates.

## 1. Configure and start

1. In the repository root, create and activate a virtual environment, then
   install Python dependencies:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` with `Copy-Item .env.example .env`, then
   edit it. Set Cloudinary credentials and a valid
   `GEMINI_API_KEY`. Keep the database URL as
   `postgresql://impact:impact@db:5432/impact_court` for Compose.
3. Generate the certificate signing key and paste the printed
   `LEDGER_PRIVATE_KEY` into `.env`:

   ```powershell
   python generate_keys.py
   ```

4. Start PostgreSQL and the API:

   ```powershell
   docker compose up --build
   ```

   Wait until the API says it is ready. On startup, it enables pgvector,
   migrates the old JSON embedding column if present, and creates the new
   tables/index. Open <http://localhost:8000/docs>.

## 2. Confirm readiness and vector setup

1. Open <http://localhost:8000/health>; expect `{"status":"ok"}`.
2. In Swagger `/docs`, inspect `GET /api/assets`. It accepts an optional
   `q` query for semantic search. This needs a Gemini key and ingested assets
   with generated vectors; an empty database correctly returns an empty list.

## 3. Create a project and ingest evidence

1. In `/docs`, call `POST /api/projects` with a test site, coordinates, radius,
   and time window. Save the returned project `id`.
2. Call `GET /api/upload-signature?project_id=<id>`.
3. Upload a real image to Cloudinary using those signed values and the folder
   returned by the API. Save the resulting `public_id`. Use an original photo
   if you want EXIF GPS/time checks to have data.
4. Call `POST /api/assets/ingest?async_mode=true` with:

   ```json
   {"project_id":"<id>","public_id":"<public_id>","resource_type":"image"}
   ```

5. Copy `job_id` from the response and poll `GET /api/jobs/{job_id}` until
   `status` is `completed` or `failed`. A completed result includes `asset_id`.
   Open `GET /api/assets/{asset_id}` and inspect its forensics, vision output,
   count, segmentation estimates, and vector-backed record.
6. Ingest at least two images from the same project if you want to test
   before/after comparison and change claims.

## 4. Test semantic search

Call `GET /api/assets?project_id=<id>&q=people planting young trees`. The API
embeds the query in Gemini's image/text vector space and orders matching
project images by pgvector cosine distance. If Gemini is not configured, the
endpoint returns HTTP 503 instead of pretending the placeholder vectors are
meaningful.

## 5. Create a claim, audit it, and inspect evidence

1. Call `POST /api/claims` with a claim such as:

   ```json
   {"project_id":"<id>","text":"We planted 50 saplings at this site during June"}
   ```

2. Save `claim.id` and inspect the returned sub-claims. Gemini should create
   checkable sub-claims; if it fails, the rule-based fallback keeps creation
   available, though it may produce only a generic activity sub-claim.
3. Call `POST /api/claims/{claim_id}/audit?async_mode=true`. Poll the returned
   job URL until it completes. To run in the request instead, omit
   `async_mode=true`.
4. Call `GET /api/claims/{claim_id}/evidence`. Confirm evidence rows connect
   sub-claims to assets and include `supports`, `contradicts`, or `context`,
   relevance, forensic flags, and any observed count/change details.
5. Check the audit response or re-read the claim in `/docs`. Count agreement
   sums visual model estimates across matched images and compares that total
   with the claim's number; repeated views can count the same objects more
   than once. If the
   sub-claim contains a change metric, the model compares the earliest and
   latest matched images and scores agreement with the requested direction.
   Treat both as approximate visual estimates.

## 6. Test before/after comparison

Call `POST /api/compare` with two ingested asset IDs from the same scene:

```json
{"before_asset_id":"<before_id>","after_asset_id":"<after_id>"}
```

Inspect `alignment_score`, `class_delta_json`, `analysis_json`, and the
Cloudinary transformation URL. Misaligned views may produce unreliable
changes; the model's alignment and measurement are estimates.

## 7. Test PDF report generation

1. Call `POST /api/reports` with:

   ```json
   {"claim_id":"<claim_id>"}
   ```

2. Open the returned `download_url` in a browser or call the GET route. Confirm
   the PDF includes project and claim details, verdict/confidence, sub-claims,
   matched evidence, available thumbnails, flags, and the latest certificate
   when one exists. The PDF is also saved under the local `reports/` folder.

## 8. Test certificate traceability and tamper checks

1. Call `POST /api/claims/{claim_id}/certificate`.
2. Inspect `leaves` for `asset`, `model_output`, `transformation`,
   `evidence_link`, and `verdict` entries as applicable.
3. Call `GET /api/verify/{certificate_id}` and expect `verification.valid` to
   be `true`.
4. Call `GET /api/ledger/verify`; expect `valid: true` and a positive entry
   count. This checks the database event hash chain.

## 9. Test duplicate red-team behavior

Upload the same image again to Cloudinary and call
`POST /api/redteam/check?project_id=<id>&public_id=<duplicate_public_id>`.
The report should list the matching ingested asset, add `reused_image`, and
return `FAKE / FLAGGED` even when the match is from the same project.

## Expected boundaries

- Jobs are stored in PostgreSQL, but execution uses FastAPI's in-process
  background-task facility. They are not a separate durable queue; a restart
  marks in-flight jobs failed.
- Gemini vision estimates are not ground truth. If Gemini is unconfigured,
  image vectors and visual measurements are unavailable and semantic search
  returns a clear error.
- Reports are saved on the API host under `reports/`; keep that folder mounted
  or use shared storage before running multiple API containers.
