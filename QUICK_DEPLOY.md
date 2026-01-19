# Quick Deployment Guide

Follow these steps to deploy your Feedback Analysis Tool to Cloudflare.

## Prerequisites

1. **Cloudflare Account** (free tier works) - Sign up at https://dash.cloudflare.com/sign-up
2. **Node.js 16+** installed
3. **Git** (optional, for Pages deployment)

---

## Step 1: Install Wrangler CLI

Open your terminal and run:

```bash
npm install -g wrangler
```

Verify installation:
```bash
wrangler --version
```

---

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser. Click "Allow" to authorize Wrangler.

---

## Step 3: Set Up D1 Database

Navigate to the worker directory:
```bash
cd worker
```

Create the D1 database:
```bash
wrangler d1 create feedback-db
```

**Important:** Copy the `database_id` from the output. It looks like:
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Now update `wrangler.toml`:
1. Open `worker/wrangler.toml`
2. Find the line: `database_id = "your-database-id-here"`
3. Replace it with your actual database ID

Example:
```toml
[[d1_databases]]
binding = "DB"
database_name = "feedback-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # Your actual ID
```

Run the database migration (IMPORTANT: Use --remote flag for production):
```bash
# For production (remote) database:
wrangler d1 execute feedback-db --file=./schema.sql --remote

# For local development database:
wrangler d1 execute feedback-db --file=./schema.sql
```

---

## Step 4: Set Up KV Namespace

Create production KV namespace:
```bash
wrangler kv namespace create CACHE
```

**Copy the `id` from the output.**

Create preview KV namespace:
```bash
wrangler kv namespace create CACHE --preview
```

**Copy the `preview_id` from the output.**

Update `worker/wrangler.toml`:
1. Find the `[[kv_namespaces]]` section
2. Replace `id = "your-kv-namespace-id-here"` with your production ID
3. Replace `preview_id = "your-kv-preview-id-here"` with your preview ID

Example:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "1234567890abcdef1234567890abcdef"  # Production ID
preview_id = "abcdef1234567890abcdef1234567890"  # Preview ID
```

---

## Step 5: Deploy Workers Backend

Make sure you're in the `worker` directory:
```bash
cd worker
```

Install dependencies (if not already done):
```bash
npm install
```

Deploy:
```bash
wrangler deploy
```

**Success!** You'll see output like:
```
✨ Success! Deployed to https://feedback-analysis-api.your-subdomain.workers.dev
```

**Copy this URL** - you'll need it for the frontend!

---

## Step 6: Deploy Frontend to Pages

### Option A: Using Cloudflare Dashboard (Recommended)

1. **Build the frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

2. **Go to Cloudflare Dashboard:**
   - Visit https://dash.cloudflare.com
   - Click "Workers & Pages" in sidebar
   - Click "Create application"
   - Click "Pages" tab
   - Click "Connect to Git" (if you have a repo) OR "Upload assets"

3. **If uploading directly:**
   - Click "Upload assets"
   - Select the `frontend/dist` folder
   - Click "Deploy site"

4. **Set Environment Variable:**
   - Go to your Pages project → Settings → Environment Variables
   - Click "Add variable"
   - Name: `VITE_API_URL`
   - Value: Your Workers URL (from Step 5)
   - Click "Save"

5. **Redeploy** (if needed) to pick up the environment variable

### Option B: Using Wrangler CLI

```bash
cd frontend
npm install
npm run build
wrangler pages deploy dist --project-name=feedback-analysis
```

Then set the environment variable in the dashboard (same as Option A, step 4).

---

## Step 7: Test Your Deployment

1. **Visit your Pages URL** (shown after deployment)
2. **Test adding feedback:**
   - Go to "Add Feedback" tab
   - Enter some test feedback
   - Click "Add Feedback"

3. **Check the Dashboard:**
   - Go to "Dashboard" tab
   - You should see statistics and charts

4. **Test the API directly:**
   ```bash
   curl https://your-workers-url.workers.dev/api/feedback
   ```

---

## Troubleshooting

### "Database not found" error
- Make sure you updated `wrangler.toml` with the correct database ID
- Run: `wrangler d1 execute feedback-db --file=./schema.sql` again

### "KV namespace not found" error
- Verify KV namespace IDs in `wrangler.toml`
- Make sure you created both production and preview namespaces

### Frontend can't connect to API
- Check that `VITE_API_URL` is set correctly in Pages environment variables
- Make sure the Workers URL is correct
- Check browser console for CORS errors

### CORS errors
- Workers already include CORS headers
- If issues persist, check that your Pages URL is allowed

---

## Your Deployment URLs

After deployment, you'll have:

- **Workers API:** `https://feedback-analysis-api.[your-subdomain].workers.dev`
- **Pages Frontend:** `https://feedback-analysis.[your-pages-subdomain].pages.dev`

Add these to your `SUBMISSION_SUMMARY.md` for the assignment!

---

## Quick Commands Reference

```bash
# Login
wrangler login

# Create D1 database
wrangler d1 create feedback-db

# Run migrations
wrangler d1 execute feedback-db --file=./schema.sql

# Create KV namespace
wrangler kv namespace create CACHE
wrangler kv namespace create CACHE --preview

# Deploy Workers
cd worker
wrangler deploy

# Deploy Pages
cd frontend
npm run build
wrangler pages deploy dist --project-name=feedback-analysis

# Local development
cd worker
wrangler dev  # Runs on http://localhost:8787
```

---

## Next Steps

1. ✅ Deploy Workers backend
2. ✅ Deploy Pages frontend
3. ✅ Test the application
4. ✅ Update `SUBMISSION_SUMMARY.md` with your URLs
5. ✅ Take screenshot of Workers Bindings page (for architecture section)
6. ✅ Compile PDF for submission

Good luck! 🚀
