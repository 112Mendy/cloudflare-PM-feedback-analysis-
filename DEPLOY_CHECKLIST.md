# Deployment Checklist

Use this checklist to ensure you complete all deployment steps.

## Pre-Deployment

- [ ] Cloudflare account created (free tier is fine)
- [ ] Node.js 16+ installed (`node --version`)
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] Logged into Cloudflare (`wrangler login`)

## Backend (Workers) Deployment

- [ ] Navigated to `worker` directory
- [ ] Created D1 database: `wrangler d1 create feedback-db`
- [ ] Copied database ID from output
- [ ] Updated `wrangler.toml` with database ID
- [ ] Ran database migration: `wrangler d1 execute feedback-db --file=./schema.sql`
- [ ] Created KV production namespace: `wrangler kv namespace create CACHE`
- [ ] Copied KV production ID from output
- [ ] Created KV preview namespace: `wrangler kv namespace create CACHE --preview`
- [ ] Copied KV preview ID from output
- [ ] Updated `wrangler.toml` with both KV IDs
- [ ] Installed dependencies: `npm install` (in worker directory)
- [ ] Deployed Workers: `wrangler deploy`
- [ ] Copied Workers URL (e.g., `https://feedback-analysis-api.xxx.workers.dev`)

## Frontend (Pages) Deployment

- [ ] Navigated to `frontend` directory
- [ ] Installed dependencies: `npm install`
- [ ] Built frontend: `npm run build`
- [ ] Deployed to Pages (via Dashboard or CLI)
- [ ] Set environment variable `VITE_API_URL` to Workers URL
- [ ] Copied Pages URL (e.g., `https://feedback-analysis.xxx.pages.dev`)

## Testing

- [ ] Visited Pages URL in browser
- [ ] Tested adding feedback
- [ ] Checked Dashboard shows data
- [ ] Tested filtering functionality
- [ ] Verified API works: `curl https://your-workers-url.workers.dev/api/feedback`

## Documentation

- [ ] Updated `SUBMISSION_SUMMARY.md` with:
  - [ ] Workers URL
  - [ ] Pages URL
  - [ ] GitHub repository link (if applicable)
- [ ] Took screenshot of Workers Bindings page (for architecture section)
- [ ] Verified all documents are complete:
  - [ ] PRODUCT_INSIGHTS.md
  - [ ] ARCHITECTURE_RATIONALE.md
  - [ ] SUBMISSION_SUMMARY.md

## Submission

- [ ] Compiled PDF with all required sections
- [ ] Included project links
- [ ] Included product insights (3-5 items)
- [ ] Included architecture overview with screenshot
- [ ] Optional: Included vibe-coding context
- [ ] Submitted via assignment link

---

## Quick Command Reference

```bash
# Setup
npm install -g wrangler
wrangler login

# Backend
cd worker
wrangler d1 create feedback-db
# Copy database_id to wrangler.toml
wrangler d1 execute feedback-db --file=./schema.sql
wrangler kv namespace create CACHE
wrangler kv namespace create CACHE --preview
# Copy IDs to wrangler.toml
npm install
wrangler deploy

# Frontend
cd ../frontend
npm install
npm run build
wrangler pages deploy dist --project-name=feedback-analysis
# Set VITE_API_URL in Pages dashboard
```
