# Firebase Admin (server) and local dev setup

This project uses both the Firebase client SDK (for per-user operations) and optionally the Firebase Admin SDK (for server-side cross-user reads/writes).

If you want server endpoints (`/api/get-report`, `/api/search-reports`, server-side create) to be able to read across all users or perform admin-only operations, configure Firebase Admin with a service account.

## Local development

1. Create a service account JSON in Google Cloud Console (IAM & Service Accounts).
   - Role: `Firebase Admin` or custom with `Cloud Datastore / Firestore` read/write and `Firebase` privileges.
   - Download the JSON key file.

2. Option A — Application Default Credentials (ADC):

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/full/path/to/service-account.json"
npm run dev
```

3. Option B — Use the project's expected env var (`FIREBASE_ADMIN_CREDENTIALS`):

```bash
cat /full/path/to/service-account.json | jq -c . > /tmp/sa.json
export FIREBASE_ADMIN_CREDENTIALS="$(cat /tmp/sa.json)"
npm run dev
```

The code in `src/pages/api/admin-init.ts` tries both: if `FIREBASE_ADMIN_CREDENTIALS` is present it uses that, otherwise it falls back to ADC.

## Vercel (production)

1. In the Vercel dashboard for your project, go to Settings → Environment Variables.
2. Add a new variable named `FIREBASE_ADMIN_CREDENTIALS` with the value equal to the minified JSON of your service account. Example (copy-paste the single-line JSON):

```
{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...",...}
```

3. Mark the var for the environments you need (Preview/Production).
4. Redeploy the project.

Alternatively, you can create a Vercel secret and reference it as `@secretName` in the environment variable.

## Security note
- Keep service account JSON private. Use Vercel secrets or encrypted env vars.
- Restrict the service account to the minimum required privileges.

## Quick verification
- After setting credentials, call:
  - `GET /api/get-report?uin=YOUR_UIN&debug=1`
  - `GET /api/search-reports?uin=YOUR_UIN`
  - `POST /api/create-report` (server-side) — these should stop returning Project ID/auth errors.

If you want, I can add a small admin-check route that returns whether admin was initialized and the detected project ID.
