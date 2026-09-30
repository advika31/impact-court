# Step-by-step full-stack test guide

This walkthrough exercises the Next.js UI, FastAPI API, PostgreSQL, Cloudinary,
the Gemini vision/claim services, the trained activity classifier when its
weights and encoder load, evidence auditing, certificates, and reports. A
Cloudinary account and Gemini API key are required for the complete media flow.
Vision counts and scene measurements are estimates and should not be treated as
ground truth.

## 1. Configure credentials and signing key

1. From the repository root, copy the environment template and edit it:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`, and `GEMINI_API_KEY`. Keep
   `DATABASE_URL=postgresql://impact:impact@db:5432/impact_court` for Compose.
   Leave `NEXT_PUBLIC_API_URL=http://localhost:8000` for local Compose use.
3. Generate an Ed25519 signing key. If PyNaCl is not installed in your local
   Python, install just that package first:

   ```powershell
   python -m pip install PyNaCl
   python generate_keys.py
   ```

4. Copy the printed `LEDGER_PRIVATE_KEY=...` value into `.env`. Do not share
   or commit the private key.

## 2. Start the complete app

From the repository root, run:

```powershell
docker compose up --build
```

Compose starts PostgreSQL with pgvector, the FastAPI service, and the Next.js
web app. Wait for all three services to finish starting. Open:

- Web app: <http://localhost:3000>
- API health: <http://localhost:8000/health>
- Interactive API docs: <http://localhost:8000/docs>

The health endpoint should return `{"status":"ok"}`. If you add the signing
key after the containers have started, restart the API with
`docker compose restart api`.

## 3. Create a project and upload evidence in the UI

1. On the customer portal, create a project with its site coordinates, radius,
   and evidence date window. If projects already exist, choose one from the
   selector.
2. Enter an impact claim, for example: `We planted 50 saplings at this site
   during June.`
3. Select one or more real JPEG, PNG, or WebP images and submit. The browser
   requests a signed upload configuration from FastAPI, uploads each image to
   Cloudinary, and asks the API to ingest it.
4. Wait for the UI to report successful ingestion and claim decomposition. The
   API calculates hashes, checks available EXIF/location/time data, runs the
   configured vision services, stores each asset, and returns the claim ID.
5. Open the Admin ML Portal. The project selector, evidence vault, asset search,
   and project evidence count should show records from PostgreSQL, not sample
   records.

For photos without EXIF, the app should show missing GPS or capture time rather
than invent coordinates. To test before/after and duplicate matching, ingest at
least two images, and ingest a copy of one image into another project.

## 4. Audit the claim and inspect evidence

1. In Claim Court, the submitted claim should load with its decomposed
   sub-claims. You can also enter a claim directly in this screen.
2. Select **Run evidence audit**. The UI polls the backend job until it
   completes and then displays the persisted verdict, confidence, and reasons.
3. Use `/docs` to call `GET /api/claims/{claim_id}/evidence`. Each returned row
   should link a sub-claim to an asset with a support, contradiction, or context
   role.
4. Try the Evidence Vault search box. With a Gemini key, it uses vector search;
   without one, the API falls back to activity/public-ID text filtering.

## 5. Compare two project images

1. Open **Before & After** in the Admin portal.
2. Choose different ingested images in the Before and After selectors, then
   press **Analyze pair**.
3. Check the returned vision analysis, alignment score, estimated scene deltas,
   and Cloudinary transformation link. The model values are estimates, and
   unrelated camera views may not be meaningfully comparable.

## 6. Run the red-team check

1. Open **Red-Team Arena**, choose an image, and press **Upload and analyze**.
2. The image is uploaded to Cloudinary using a server-signed request, then
   checked against project metadata and stored perceptual hashes.
3. Re-uploading a previously ingested image should return a duplicate candidate
   and a flagged result. A new image with no matching stored asset may still be
   flagged for out-of-bounds location/time metadata.

## 7. Issue and verify a certificate

1. Return to the audited claim in Claim Court and choose **Issue certificate**.
   The `LEDGER_PRIVATE_KEY` must be set in `.env`.
2. The Verification Proof tab should display the returned certificate ID,
   Merkle root, signature, public key, and leaves.
3. Press **Re-verify with API**. The result should show valid if the stored
   certificate's Merkle proof and signature are intact.
4. In `/docs`, `GET /api/ledger/verify` should return `valid: true` if the
   append-only ledger chain is consistent.

## 8. Generate a report and Cloudinary social cards

1. Open **Campaign & Reports** for the selected project. The claim created in
   the upload flow should be selected.
2. Press **Generate PDF report**, then open/download the returned PDF.
3. If the claim has a certificate and persisted evidence links, the response
   also includes Cloudinary verified-badge transformation URLs for social-card
   previews. Without a certificate, the PDF is still generated but no verified
   social cards are returned.

## 9. Useful direct API checks

- `GET /api/projects` — list persisted projects
- `GET /api/assets?project_id=<id>&q=planting` — search project evidence
- `POST /api/claims/{claim_id}/audit?async_mode=true` — queue an audit
- `GET /api/jobs/{job_id}` — poll ingest/audit job status
- `POST /api/reports` with `{"claim_id":"<id>"}` — generate report
- `GET /api/reports/{report_id}` — download report

## Troubleshooting and limitations

- **Cloudinary upload fails:** check the cloud name, key, secret, and that the
  API container has reloaded after `.env` changes.
- **Vision outputs are unavailable:** check `GEMINI_API_KEY` and API logs. The
  trained classifier is used only if `models/activity_classifier_final.pkl`
  and its OpenCLIP encoder load; it does not replace Gemini embeddings or
  image-count/change interpretation.
- **No preview images:** ensure `CLOUDINARY_CLOUD_NAME` is set in `.env`; the
  browser uses it to form Cloudinary delivery URLs.
- **Audits/reports are slow:** image analysis can call Gemini for each asset.
  Jobs use FastAPI in-process background tasks, not a durable external queue;
  restarting the API marks queued/running jobs failed.
- **Certificate signing fails:** set `LEDGER_PRIVATE_KEY` in `.env` and restart
  the API container.
- **Report PDF links stop working after container removal:** generated files
  live under the API `reports/` directory. Keep it mounted or adopt shared
  object storage before deploying multiple API replicas.
