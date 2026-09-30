# Impact Court — current local implementation

Next.js frontend connected to a FastAPI backend for Cloudinary image ingestion,
forensics, Gemini vision, claim scoring, signed certificates, job status, and
evidence reports. See
[TESTING.md](TESTING.md) for a complete manual end-to-end walkthrough.

## Run locally with Docker

Copy `.env.example` to `.env` and fill in Cloudinary and Gemini credentials.
Generate a signing key and put the printed private key in `.env` before issuing
certificates. Docker Compose starts PostgreSQL, the API, and the web app.

```bash
cp .env.example .env
python -m pip install PyNaCl
python generate_keys.py
# Add the printed private key and Cloudinary/Gemini credentials to .env
```

Recommended full-stack runtime:

```bash
docker compose up --build
```

Open <http://localhost:3000> for the web app and
<http://localhost:8000/docs> for the API. Docker Compose uses a pgvector PostgreSQL
image, creates the `vector` extension, migrates legacy embedding columns to the
current 512-dimensional vector column (incompatible old embeddings are cleared), and creates the
cosine-search index. Use `.env.example` as the variable list. Never commit
`.env`.

## Current behavior

- Cloudinary signed upload, image ingestion, SHA-256, EXIF and geo/time checks,
  pHash duplicate detection, and Cloudinary metadata update.
- Gemini Embedding 2 image/text vectors in shared space; pgvector cosine search
  through `GET /api/assets?q=...`.
- Gemini image interpretation for activity, approximate object counts, scene
  proportions, and before/after estimates. These are model estimates and need
  human review. Without `GEMINI_API_KEY`, Gemini embeddings and vision estimates
  are unavailable; the trained activity classifier may still work if its model
  and OpenCLIP weights load. No synthetic vectors are written.
- The repository's `models/activity_classifier_final.pkl` is used with the
  OpenCLIP encoder when both can load. If unavailable, Gemini image
  interpretation supplies the activity estimate when configured.
- Claim audits retrieve a small set of relevant assets, persist `Evidence`
  rows, use per-asset forensic signals, and calculate approximate count/change
  agreement when the relevant model output is available.
- `async_mode=true` on ingest and audit creates a database job visible at
  `GET /api/jobs/{job_id}`. The worker is in-process for this MVP; pending jobs
  are marked failed if the API restarts.
- The web app uses the backend project list, uploads selected images directly
  to Cloudinary with server-generated signatures, waits for ingestion jobs,
  and connects the evidence vault, claim audit, comparison, red-team check,
  certificate verification, and PDF/social-card report views to API results.
- `POST /api/reports` builds a PDF with claim verdicts, evidence, thumbnails,
  forensic details, and the latest certificate; `GET /api/reports/{id}` downloads it.
- Certificate leaves cover asset hashes, model output, saved transformation
  URLs, evidence links, and subclaim verdicts. `GET /api/ledger/verify` checks
  the database hash chain.

The previous `services/api/vision_stub.py` is replaced by `services/api/vision.py`.
The Gemini model can miscount objects or misread scene changes; report those
outputs as estimates rather than ground truth. Count totals sum estimates
across matched photos and can double-count objects visible in multiple images.
The job runner is not a durable
external queue, and deployment is not included in this local change.

For frontend-only development, keep the API running and start Next.js from the
`frontend/` directory with `npm ci` then `npm run dev`. Set
`NEXT_PUBLIC_API_URL` to the browser-reachable API URL and
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to the Cloudinary cloud name. With the
Compose setup, those values are read from `.env` and the frontend is available
on port 3000.

## Main endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/{project_id}` | Read a project |
| GET | `/api/upload-signature?project_id=...` | Sign direct Cloudinary upload |
| POST | `/api/assets/ingest` | Ingest image; add `?async_mode=true` for tracked job |
| GET | `/api/assets?project_id=...&q=...` | List/filter or semantic-search assets |
| GET | `/api/assets/{asset_id}` | Read asset and stored analysis |
| POST | `/api/compare` | Compare two images and store transformation/model output |
| POST | `/api/claims` | Decompose a claim |
| GET | `/api/claims/{claim_id}` | Read claim and sub-claims |
| POST | `/api/claims/{claim_id}/audit` | Retrieve evidence and score; supports `?async_mode=true` |
| GET | `/api/claims/{claim_id}/evidence` | Read matched assets and support/contradict/context roles |
| POST | `/api/claims/{claim_id}/certificate` | Sign asset, model, transformation, evidence, and verdict leaves |
| GET | `/api/verify/{certificate_id}` | Verify the saved certificate |
| POST | `/api/reports` | Generate a PDF report for a claim |
| GET | `/api/reports/{report_id}` | Download the PDF |
| GET | `/api/jobs/{job_id}` | Inspect queued/running/completed/failed work |
| GET | `/api/ledger/verify` | Verify hash-chain continuity |
| POST | `/api/redteam/check` | Check an uploaded image for forensic issues and any duplicate |

## Structure

- `services/api/main.py` — endpoints, evidence matching, job status, certificates
- `services/api/vision.py` — Gemini embeddings and image interpretation
- `services/api/reporting.py` — PDF report layout
- `services/api/models.py` — SQLAlchemy models, including pgvector column
- `packages/forensics/forensics.py` — EXIF, geo/time, pHash
- `packages/claims/claims.py` — Gemini decomposition and weighted scoring
- `packages/ledger/ledger.py` — Merkle proofs, Ed25519, and certificate logic
