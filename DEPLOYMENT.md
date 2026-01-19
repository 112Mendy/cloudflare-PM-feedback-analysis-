# Deployment Guide

## Cloudflare Platform Deployment

This guide covers deploying the Feedback Analysis Tool to Cloudflare's platform.

### Prerequisites

1. Cloudflare account (free tier works)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Node.js 16+ installed

### Step 1: Install Wrangler and Login

```bash
npm install -g wrangler
wrangler login
```

This will open your browser to authenticate with Cloudflare.

### Step 2: Create D1 Database

```bash
cd worker
wrangler d1 create feedback-db
```

This will output something like:
```
✅ Successfully created DB 'feedback-db'!

[[d1_databases]]
binding = "DB"
database_name = "feedback-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the `database_id` and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "feedback-db"
database_id = "your-database-id-here"  # Paste the ID here
```

### Step 3: Run Database Migration

```bash
wrangler d1 execute feedback-db --file=./schema.sql
```

### Step 4: Create KV Namespace

```bash
wrangler kv namespace create CACHE
```

This will output:
```
🌀  Creating namespace with title "feedback-analysis-api-CACHE"
✨  Successfully created namespace "CACHE" with id "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

Add the following to your configuration file in your kv_namespaces array:
{ binding = "CACHE", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

Also create a preview namespace:
```bash
wrangler kv namespace create CACHE --preview
```

Update `wrangler.toml` with both IDs:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-production-id-here"
preview_id = "your-preview-id-here"
```

### Step 5: Deploy Workers Backend

```bash
cd worker
wrangler deploy
```

After deployment, you'll get a URL like:
```
https://feedback-analysis-api.your-subdomain.workers.dev
```

### Step 6: Deploy Frontend to Pages

#### Option A: Via Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect your Git repository
4. Set build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Add environment variable:
   - Variable: `VITE_API_URL`
   - Value: Your Workers URL (e.g., `https://feedback-analysis-api.your-subdomain.workers.dev`)

#### Option B: Via Wrangler CLI

```bash
cd frontend
npm install
npm run build
wrangler pages deploy dist --project-name=feedback-analysis
```

Then set environment variable in Pages dashboard.

### Step 7: Update Frontend API URL

In Cloudflare Pages dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `VITE_API_URL` = `https://your-workers-url.workers.dev`

Or update `frontend/_redirects` to proxy API requests:
```
/api/*  https://your-workers-url.workers.dev/api/:splat  200
```

### Step 8: Test Deployment

1. Visit your Pages URL
2. Try adding feedback
3. Check the Dashboard for analysis

## Local Development with Cloudflare

### Workers (Backend)

```bash
cd worker
npm install
wrangler dev
```

Workers will run on `http://localhost:8787`

### Pages (Frontend)

```bash
cd frontend
npm install
# Set VITE_API_URL=http://localhost:8787 in .env file
npm run dev
```

## Troubleshooting

### D1 Database Issues

- Make sure database ID is correct in `wrangler.toml`
- Run migrations: `wrangler d1 execute feedback-db --file=./schema.sql`
- Check database in dashboard: `wrangler d1 info feedback-db`

### KV Issues

- Verify namespace IDs in `wrangler.toml`
- Check KV in dashboard: Cloudflare Dashboard → Workers & Pages → KV

### CORS Issues

- Workers already include CORS headers
- Make sure frontend URL is allowed (or use `*` for development)

### API Not Found

- Verify Workers URL is correct
- Check `VITE_API_URL` environment variable
- Test Workers directly: `curl https://your-workers-url.workers.dev/api/feedback`

## Monitoring

- **Workers Analytics**: Cloudflare Dashboard → Workers & Pages → Your Worker → Analytics
- **D1 Queries**: Cloudflare Dashboard → Workers & Pages → D1 → Your Database
- **Pages Analytics**: Cloudflare Dashboard → Pages → Your Project → Analytics

## Cost Estimation

### Free Tier Limits (per month)
- **Workers**: 100,000 requests/day
- **D1**: 5GB storage, 5M reads, 100K writes
- **Pages**: Unlimited requests, 500 builds
- **KV**: 100,000 reads/day, 1,000 writes/day

For most prototypes, the free tier is sufficient!
