# Impact Court — Build Guide (Person 1 + Person 2)

This guide describes the current implementation in this repository's `main`
branch. It covers the FastAPI platform (Cloudinary, PostgreSQL, API) and
trust engine (forensics, claims, scoring, and signed certificates). It also
calls out areas that are still placeholders so the demo does not overstate
what the code currently verifies.

---

## 0. Concepts

- **EXIF metadata** is information embedded in photos, such as capture time,
  camera model, and sometimes GPS coordinates. Missing metadata is a signal
  to consider, not proof that an image is fake.
- **Perceptual hash (pHash)** fingerprints visual content. Similar hashes
  can identify exact or near-duplicate images, including some resized or
  recompressed copies.
- **Merkle tree** combines certificate entries into a root hash. The
  certificate includes proofs for its leaves.
- **Ed25519 signature** lets a verifier check that the certificate root was
  signed by the holder of the private key.
- **Certificate** contains the claim ID, leaves, proofs, Merkle root,
  signature, and public key. Verification checks the stored certificate's
  cryptographic integrity; it does not establish that a source photo was
  truthful when captured.

---

## 1. Prerequisites

Install:

- Docker Desktop (recommended; Compose runs both PostgreSQL and the API)
- Python 3.11+ (needed only for the optional local-Uvicorn setup or standalone
  module commands)
- A Cloudinary account and its cloud name, API key, and API secret
- A Gemini API key if you want Gemini claim decomposition

---

## 2. Configure Cloudinary

From the Cloudinary console, copy the cloud name, API key, and API secret.
Uploads use the `impact-court/<project_id>/...` folder convention. The API
also writes selected structured metadata after ingestion.

---

## 3. Configure `.env`

Create `.env` in the repository root. The checked-in `.env.example` is
currently stale for LLM settings: it still names Anthropic variables.
For this code, use `GEMINI_API_KEY` and, optionally,
`CLAIMS_LLM_MODEL`.

Example:

```dotenv
DATABASE_URL=postgresql://impact:impact@db:5432/impact_court
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
CLAIMS_LLM_MODEL=gemini-2.5-flash-lite
LEDGER_PRIVATE_KEY=
```

The model defaults to `gemini-2.5-flash-lite` when
`CLAIMS_LLM_MODEL` is unset. If `GEMINI_API_KEY` is missing or Gemini calls
fail / return invalid JSON, claim decomposition falls back to one
rule-based `activity` sub-claim with an `unknown` label and the original
text. This keeps the endpoint running, but it is not equivalent to a
successful structured decomposition.

Never commit `.env` or real credentials.

---

## 4. Generate the certificate signing key

From the repository root, run:

```bash
python generate_keys.py
```

Copy the printed `LEDGER_PRIVATE_KEY=...` value into `.env`. Keep the
private key secret. The signing key is required by the certificate endpoint.

The ledger module can also be exercised directly:

```bash
python -m packages.ledger.test_ledger
```

---

## 5. Start the API and database

### Recommended: run the API in Docker

The Compose file starts PostgreSQL and the API together. From the repository
root, create the `.env` file above, then run:

```bash
docker compose up --build
```

The API is available at <http://localhost:8000>; interactive API docs are at
<http://localhost:8000/docs>. Check `GET /health` for
`{"status":"ok"}`.

Stop the services with `Ctrl+C`. To stop detached services, use
`docker compose down`. The database volume persists unless explicitly
removed.

### Alternative: run Uvicorn on your machine

This is supported by the current Compose configuration, provided Python
dependencies are installed locally and PostgreSQL is available on the host.
Set the database host to `localhost` in `.env`:

```dotenv
DATABASE_URL=postgresql://impact:impact@localhost:5432/impact_court
```

Start only the database container, then start the API from the repository
root:

```bash
docker compose up -d db
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn services.api.main:app --reload --port 8000
```

Use the Docker Compose database credentials shown in `docker-compose.yml`.
When using the local alternative, the `.env` file is read by the application
environment only if the project or your shell loads it; export its variables
before starting Uvicorn if they are not otherwise loaded. The `db` hostname
works inside the Compose network; `localhost` is for Uvicorn running on your
machine.

---

## 6. Current API endpoints

Open `/docs` for the live request schemas and interactive calls.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/{project_id}` | Read a project |
| GET | `/api/upload-signature?project_id=...` | Create Cloudinary upload signature |
| POST | `/api/assets/ingest` | Fetch an uploaded asset, hash it, run forensics and placeholder vision, and save it |
| GET | `/api/assets` | List assets; optional `project_id` filter and `q` ranking |
| GET | `/api/assets/{asset_id}` | Read an asset |
| POST | `/api/compare` | Save a before/after comparison (currently stub output) |
| POST | `/api/claims` | Create a claim and decompose it into sub-claims |
| POST | `/api/claims/{claim_id}/audit` | Score the claim's sub-claims |
| POST | `/api/claims/{claim_id}/certificate` | Build and save a signed certificate |
| GET | `/api/verify/{certificate_id}` | Verify a saved certificate |
| POST | `/api/redteam/check` | Analyze a Cloudinary asset without saving it as an Asset row |

---

## 7. Walk through the main flow

### 7.1 Create a project

Call `POST /api/projects` with:

```json
{
  "name": "Site A Reforestation",
  "site_lat": 12.9716,
  "site_lng": 77.5946,
  "site_radius_km": 2.0,
  "window_start": "2026-03-01T00:00:00",
  "window_end": "2026-06-30T23:59:59"
}
```

Save the returned project `id`.

### 7.2 Sign, upload, and ingest an asset

Call `GET /api/upload-signature?project_id=<id>`, upload the image to
Cloudinary with the returned signed parameters, and keep its `public_id`.

Then call `POST /api/assets/ingest`:

```json
{"project_id": "<id>", "public_id": "<cloudinary_public_id>", "resource_type": "image"}
```

Ingestion downloads the bytes, calculates SHA-256 and pHash, extracts
available EXIF data, checks the declared location/time window, calls the
vision placeholder, stores an Asset row, and mirrors selected metadata to
Cloudinary.

For a direct forensics-module check, use
`python -m packages.forensics.test_forensics /path/to/photo.jpg`. Use an
original camera photo if you expect GPS/time EXIF; shared or downloaded
images often have that metadata removed.

### 7.3 Create and audit a claim

Call `POST /api/claims` with:

```json
{"project_id": "<id>", "text": "We planted 5000 trees at Site A between March and June"}
```

When configured and available, Gemini decomposes the text into sub-claims.
Otherwise the fallback produces a single generic activity sub-claim.

Call `POST /api/claims/{claim_id}/audit` to score the sub-claims. Scoring
uses weighted geo consistency, time consistency, uniqueness, quantitative
agreement, and evidence volume; hard failures can override a score.

**Current audit limitations:**

- Every asset in the project is used as evidence for every sub-claim. The
  audit does not yet retrieve or match relevant assets per sub-claim.
- `quantitative_agreement` is currently hardcoded to `0.5`; object counts
  and before/after measurements are not connected to scoring.
- The `Evidence` database table exists, but the audit flow does not populate
  Evidence rows.
- Scores and verdicts are implemented, but the evidence matching and
  quantitative signals are simplified.

### 7.4 Issue and verify a certificate

Call `POST /api/claims/{claim_id}/certificate` after auditing, then call
`GET /api/verify/{certificate_id}`. The server needs `LEDGER_PRIVATE_KEY`
to issue the certificate. Verification reports whether the certificate's
cryptographic structure and signature match.

### 7.5 Red-team check

Upload the suspect image to Cloudinary using the regular upload signature,
then call:

```text
POST /api/redteam/check?project_id=<id>&public_id=<public_id>&resource_type=image
```

The endpoint runs forensics and compares the pHash against stored assets.
It does not save an Asset row. `make_json_safe` recursively handles
dictionaries and lists, converts scalar values with `.item()`, and converts
array-like values with `.tolist()` before returning the report.

**Current behavior and limitation:** duplicate candidates are included in the
report. A cross-project duplicate adds `reused_from_other_project` and
forces a flagged verdict. A same-project duplicate by itself does not add a
flag, so the verdict can still say `no issues found` while the duplicate is
listed. The JSON helper leaves unrecognized object types unchanged; those
could still fail JSON serialization.

---

## 8. Implemented and remaining work

### Implemented

- FastAPI application, PostgreSQL models, and Docker Compose startup
- Cloudinary upload signature, asset fetching, ingestion, and metadata update
- EXIF extraction, geo/time checks, SHA-256, pHash, and duplicate candidates
- Gemini claim decomposition with a rule-based fallback
- Weighted sub-claim scoring and hard-fail override
- Merkle certificate creation and verification with Ed25519
- Asset listing and query ranking (using the current embedding values)

### Incomplete or stubbed

- `services/api/vision_stub.py` remains connected. Semantic embeddings are
  deterministic random placeholders, activity labels are hash-selected
  placeholders, object counts return zero, segmentation returns zero values,
  and before/after comparison returns no measured change.
- Semantic search therefore does not provide meaningful semantic matching.
- Audit evidence retrieval and Evidence-row creation are not implemented;
  audit currently uses all project assets and hardcodes quantitative
  agreement.
- Report generation is not implemented; there is no report endpoint.
- Job orchestration/status tracking is not implemented.
- The current API has no dedicated endpoint for persisting a transformation
  ledger or generating reports from verified evidence.

---

## 9. Honest limits for a demo

- EXIF, location, time, and duplicate checks are signals and heuristics, not
  proof of authenticity.
- A missing EXIF field can have benign causes.
- pHash catches exact and some near duplicates, not a different photo of a
  similar-looking scene.
- The certificate shows that the signed certificate data has not been
  changed since signing. It does not prove the original capture was truthful.
- Vision and quantitative outputs remain placeholders until real vision
  implementations are connected.

---

## 10. Quick checklist

- [ ] `.env` contains the database, Cloudinary, Gemini, and signing-key values
- [ ] `docker compose up --build` starts the API and database
- [ ] `GET /health` returns an OK response
- [ ] A project can be created and an asset ingested
- [ ] A claim can be created and audited, with the limitations above in mind
- [ ] A certificate can be issued and verified
- [ ] A red-team report can be returned and its duplicate list inspected
- [ ] `.env` and credentials are not committed

---

## 11. Where things live

```text
packages/ledger/ledger.py        Merkle tree, signing, certificates
packages/forensics/forensics.py  EXIF, geo/time checks, pHash
packages/claims/claims.py        Gemini decomposition and scoring
services/api/models.py           Database tables
services/api/db.py               Database connection
services/api/cloudinary_utils.py Cloudinary upload/fetch/metadata
services/api/vision_stub.py      Placeholder vision implementation
services/api/main.py             REST endpoints and integration
docker-compose.yml               PostgreSQL and API services
generate_keys.py                 Generate a certificate signing key
```
