# Sir Al Jamal Webapp

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy On Render (Recommended For This Project)

This project includes server-side JSON storage for admin/orders/leads state. On Render,
you should use a persistent disk so data survives deploys and restarts.

### Option 1: Blueprint (Fastest)

1. Push this repo to GitHub.
2. In Render, click `New` -> `Blueprint`.
3. Select your repository.
4. Render reads `render.yaml` and creates the service automatically.

### Option 2: Manual Web Service

Use these settings:

- Runtime: `Node`
- Root Directory: `webapp`
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`

Environment variables:

- `NODE_VERSION=20`
- `NODE_ENV=production`
- `ADMIN_DB_PATH=/var/data/admin-db.json`

Persistent Disk:

- Mount path: `/var/data`
- Size: `1 GB` (or more as needed)

After first deploy, open `/admin`, log in with your admin PIN, then use sync buttons if needed.

## Supabase Setup (Optional, Recommended)

This project can store admin state in Supabase with automatic fallback to local JSON if Supabase is not configured.

### 1) Create Table in Supabase

Run SQL from:

- `supabase/admin_state.sql`

### 2) Add Environment Variables

Copy `.env.example` and set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ADMIN_STATE_TABLE` (default: `admin_state`)

### 3) Verify from Admin Dashboard

Open `/admin` and click **فحص التخزين**.

- If Supabase is healthy: status shows `Supabase` mode.
- Otherwise: app automatically uses local JSON storage.
