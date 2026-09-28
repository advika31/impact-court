# Impact Court — Your Build Guide (Person 1 + Person 2, combined)

You're doing two roles solo: the **platform** (Cloudinary, database, API) and
the **trust engine** (forensics, claims, cryptographic ledger). This repo
merges both into one FastAPI service so there's no coordination overhead
between "two teams" that are both you.

Read this top to bottom once. Then come back to each numbered step as you
work through it. Every step ends with a way to check it actually worked
before you move to the next one — **do not skip the checks**. In a
hackathon, silent failures that you discover on Day 6 are what kill teams.

---

## 0. Concepts, in plain language (read this once)

- **EXIF metadata**: hidden data phones embed in photos — GPS coordinates,
  the exact timestamp, camera model. It's your primary evidence that a photo
  was taken where and when someone claims. Social apps (WhatsApp, Instagram,
  Twitter) strip it when you download an image from them — that's *itself* a
  useful signal ("this file has no EXIF" is suspicious for a "field photo").

- **Perceptual hash (pHash)**: a fingerprint of an image's *visual content*
  (not its bytes) that stays almost the same even if the image is resized,
  recompressed, or lightly cropped. Two images with a small "Hamming
  distance" between their pHashes are probably the same photo reused. This
  is how you catch someone reusing an old "before" photo in a new report.

- **Merkle tree**: a way to take a list of things (asset hashes, model
  outputs, verdicts) and boil them down to one short "root" hash, such that
  changing *any single item* anywhere in the list changes the root
  completely. Anyone holding one item plus a short "proof" can confirm that
  item was really part of the original set, without needing the whole list.
  This is the same idea Bitcoin and Git both use internally.

- **Digital signature (Ed25519)**: your server has a private key (secret)
  and a public key (shareable). Signing the Merkle root with the private key
  proves "this exact root was produced by us, at this time, and hasn't been
  swapped since." Anyone with the public key can check the signature without
  ever needing your private key.

- **Certificate**: the package you hand out publicly — the Merkle root, the
  signature, the public key, every leaf (asset hash, transformation URL,
  model output, verdict), and a proof per leaf. `verify_certificate()`
  recomputes everything from scratch and tells you if it still matches.

You don't need to understand the cryptography math. You need to understand
*what breaks if someone tampers with something* — and the answer is
"everything downstream of it, all the way to the signature check failing."

---

## 1. Install prerequisites (Day 0)

On your machine, install:
- **Python 3.11+**
- **Docker Desktop** (runs Postgres without you installing it natively)
- A **Cloudinary** account (free tier is fine) — https://cloudinary.com
- An **Anthropic API key** — https://console.anthropic.com

Then:

```bash
cd impact-court
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

If `pip install` fails on `psycopg2-binary` on macOS, install `postgresql`
via `brew install postgresql` first, then retry.

---

## 2. Get your Cloudinary credentials (Day 0)

1. Log into the Cloudinary console → Dashboard tab. Copy **Cloud name**,
   **API Key**, **API Secret**.
2. In the console, create a folder structure convention: we'll use
   `impact-court/<project_id>/...` — this happens automatically from the
   code, you don't need to pre-create folders.
3. **Register the auto-tagging add-on now, not later.** Console → Add-ons →
   find "Google Auto Tagging" (or similar) → subscribe (free tier exists).
   Approval can take time, so do this on Day 0, not Day 4. This is explicitly
   listed as a hard requirement in the problem statement ("Cloudinary must
   be a core part of the system") — judges will check for real usage.
4. Note your **plan's quota** (transformations/month, storage) so you don't
   get throttled the night before the demo.

---

## 3. Set up your `.env` file

```bash
cp .env.example .env
```

Fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`ANTHROPIC_API_KEY`. Leave `LEDGER_PRIVATE_KEY` blank for now — next step
generates it.

---

## 4. Build and test the ledger module FIRST (no dependencies)

This is intentionally your first checkpoint — it needs nothing else in the
system to work, so it's the fastest way to confirm your environment is sane.

```bash
python generate_keys.py
```

Copy the printed `LEDGER_PRIVATE_KEY=...` line into `.env`.

Now run the actual test:

```bash
python -m packages.ledger.test_ledger
```

**What you should see:** a certificate gets built, verification says
`valid=True`, then after changing one character in one leaf, verification
says `valid=False` with a `failures` list explaining why.

If you see `valid=True` both times — something is wrong, stop and re-check
`ledger.py` before going further. This exact check is your "alter one byte"
demo moment, so it needs to work perfectly, not approximately.

---

## 5. Test the forensics module with a real photo

Take a photo with your own phone's camera app right now (not a screenshot,
not something downloaded from WhatsApp — those strip EXIF). Transfer it to
your computer.

```bash
python -m packages.forensics.test_forensics /path/to/your_photo.jpg
```

**What you should see:** a JSON report with `has_exif: true`, real `lat`/`lng`
values, a `captured_at` timestamp, and a `phash` string. If `has_exif` is
`false`, you're testing with a stripped image — try a fresh, un-shared photo.

Edit the `site` dict in `test_forensics.py` to roughly match where you took
the photo, and confirm `within_site` comes back `true`. Then change the
`site_lat`/`site_lng` to somewhere far away and confirm it flips to `false`
with a `hard_fail`. This is your GPS-mismatch red-team check, working.

---

## 6. Start Postgres and the API

```bash
docker compose up -d db
uvicorn services.api.main:app --reload --port 8000
```

(If you'd rather run the API in Docker too instead of locally: change
`DATABASE_URL` in `.env` to use host `db` instead of `localhost`, then
`docker compose up --build`.)

Open **http://localhost:8000/docs** — FastAPI's auto-generated interactive
docs. This is your best friend for the next few days: you can call every
endpoint by hand from the browser, no frontend needed yet.

**Check:** `GET /health` returns `{"status": "ok"}`.

---

## 7. Walk through the full flow by hand, once, via `/docs`

Do these in order, using the Swagger UI at `/docs`. This proves the entire
backend works before anyone builds a frontend against it.

### 7.1 Create a project
`POST /api/projects` with:
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
Copy the returned `id` — you'll need it as `project_id` everywhere below.

### 7.2 Get an upload signature and upload a photo
`GET /api/upload-signature?project_id=<id>` returns signed params.

For now, upload manually via the Cloudinary console or a simple `curl`:
```bash
curl https://api.cloudinary.com/v1_1/<cloud_name>/image/upload \
  -F "file=@/path/to/your_photo.jpg" \
  -F "api_key=<api_key>" \
  -F "timestamp=<timestamp_from_signature_response>" \
  -F "signature=<signature_from_signature_response>" \
  -F "folder=impact-court/<project_id>"
```
The response JSON includes a `public_id` — copy it.

### 7.3 Ingest the asset
`POST /api/assets/ingest`:
```json
{"project_id": "<id>", "public_id": "<public_id_from_upload>", "resource_type": "image"}
```
**Check:** the response includes `forensics_json` with real EXIF and a
`phash`. This is Flow A (ingestion) working end-to-end: Cloudinary → download
→ hash → forensics → (stub) vision → Postgres → back to Cloudinary metadata.

### 7.4 Create and audit a claim
`POST /api/claims`:
```json
{"project_id": "<id>", "text": "We planted 5000 trees at Site A between March and June"}
```
This calls the LLM to decompose the claim — **check your Anthropic API key
is valid** if this errors out.

Then `POST /api/claims/{claim_id}/audit` — runs scoring against your
ingested asset(s) and returns verdicts per sub-claim.

### 7.5 Issue and verify a certificate
`POST /api/claims/{claim_id}/certificate` → returns the Merkle root,
signature, and `certificate_id`.

`GET /api/verify/{certificate_id}` → should return `"valid": true`.

**This is your whole Flow B working end-to-end.** If you got here, the
hardest part of the system — claim in, verdict + tamper-proof certificate
out — is done.

### 7.6 Try the red-team endpoint
Upload a second photo — ideally the *same* photo again, or a copy — get its
`public_id`, then:
`POST /api/redteam/check?project_id=<id>&public_id=<public_id_of_duplicate>`

**Check:** the response should flag it as a duplicate if it's genuinely a
repeat of an already-ingested photo (or the same photo you just ingested).

---

## 8. What's stubbed, and what you must not forget

`services/api/vision_stub.py` fakes every vision output (embeddings,
activity labels, object counts, before/after change). This is intentional —
it lets the *entire rest of the system* run today. But it means, right now:

- Semantic search results are **not actually meaningful** (embeddings are
  random-but-stable).
- `quantitative_agreement` in scoring is hardcoded to `0.5` — count/change
  evidence isn't real yet.
- `/api/compare` returns zeros for alignment and change.

**If nobody else on your team builds `packages/vision`, this becomes your
Day 4-5 job.** Priority order if you have to build it yourself under time
pressure:
1. Real CLIP embeddings (`embed_image`/`embed_text`) — cheap, high value,
   makes search actually work. Use `open_clip_torch` or the `sentence-transformers`
   CLIP models, both pip-installable, both run on CPU adequately for a demo.
2. A zero-shot object counter (`OWLv2` or `Grounding DINO` via Hugging Face)
   for `count_objects` — skip fine-tuning YOLO unless you have days to spare.
3. `compare_pair` using OpenCV SIFT/ORB alignment + a simple pixel-color-class
   delta (e.g. green-pixel percentage before vs after) — good enough for a
   demo number like "vegetation +31%," and honestly described as a heuristic.

Whatever you build, keep the exact same function names and return shapes —
then in `main.py` you only need to change:
```python
from services.api import vision_stub
```
to:
```python
from packages.vision import vision as vision_stub
```
and nothing else in `main.py` needs to change.

---

## 9. Honest limits to say out loud in your pitch

State these proactively — judges trust a team that names its own limits far
more than one that overclaims:

- Forensic checks are **heuristics**, not proof. A missing EXIF flag or a
  GPS mismatch is *evidence*, not certainty.
- The certificate proves evidence **was not altered after ingestion** — it
  does not prove the original photo was truthful at capture time.
- AI-generated-image detection is genuinely hard; if you don't have a real
  detector for it, say so rather than implying you catch it.
- Duplicate detection via pHash catches exact/near-duplicates and simple
  edits — it will not catch a different but similar-looking scene.

---

## 10. Daily checklist while building

- [ ] Ledger test still passes (`python -m packages.ledger.test_ledger`)
- [ ] `/health` returns ok
- [ ] Can create a project → ingest an asset → see forensics_json populated
- [ ] Can create a claim → audit it → get a verdict
- [ ] Can issue a certificate → verify it → get `valid: true`
- [ ] Tampering with a certificate leaf → verify returns `valid: false`
- [ ] `.env` is in `.gitignore` and was never committed

---

## 11. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `psycopg2` install fails | Missing native Postgres headers — install `libpq-dev` (Linux) or `postgresql` via brew (Mac) |
| `nacl` import error | `pip install pynacl` didn't run — check you're in the venv |
| Ingest returns `has_exif: false` for everything | You're testing with screenshots or downloaded/shared images — use fresh phone-camera photos |
| Claim decomposition errors | Bad/missing `ANTHROPIC_API_KEY`, or check `CLAIMS_LLM_MODEL` is a valid current model name |
| Certificate always verifies `true` even when you think you tampered it | You edited the DB/JSON in a way that changed BOTH the leaf and its stored `leaf_hash` consistently — re-run the `test_ledger.py` demo instead, which tampers correctly |
| Cloudinary upload signature rejected | `timestamp` used in the actual upload must exactly match the one returned by `/api/upload-signature` — don't regenerate it |

---

## 12. Where things live (quick map)

```
packages/ledger/ledger.py        Merkle tree, signing, certificates — build/test this first
packages/forensics/forensics.py  EXIF, geo/time checks, pHash duplicate detection
packages/claims/claims.py        LLM claim decomposition, scoring weights
services/api/models.py           Database tables
services/api/db.py               DB connection
services/api/cloudinary_utils.py Cloudinary upload/fetch/metadata/transformations
services/api/vision_stub.py      Placeholder for real ML (swap out when ready)
services/api/main.py             All REST endpoints, wires everything together
generate_keys.py                 Run once to create your signing keypair
```

You now have a working backend. The next job is a frontend against this API
(Person 4's track in the team doc) and, if nobody else picks it up, the real
vision module described in section 8 above.
