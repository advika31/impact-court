# Impact Court web app

This Next.js interface uses the FastAPI service in the repository root. For a
complete local setup, follow the root [README](../README.md) and
[full-stack test guide](../TESTING.md); `docker compose up --build` starts the
web app, API, and PostgreSQL together.

## Run only the web app locally

Start the API and database first. Then from this directory:

```powershell
npm ci
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000"
$env:NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "your_cloud_name"
npm run dev
```

Open <http://localhost:3000>. The API URL must be reachable from the browser,
and the Cloudinary cloud name is used to display uploaded media. The browser
never receives the Cloudinary API secret; signed upload parameters come from
FastAPI.
