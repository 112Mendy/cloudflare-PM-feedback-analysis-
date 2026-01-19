# Troubleshooting Guide

## "Error adding feedback" Issue

If you're getting "Error adding feedback" when trying to add feedback, check the following:

### 1. Check Browser Console

Open browser DevTools (F12) → Console tab and look for:
- API URL being used
- Network errors
- CORS errors
- Detailed error messages

### 2. Verify Workers is Deployed

Test your Workers API directly:
```bash
curl https://your-workers-url.workers.dev/api/feedback
```

Or visit in browser: `https://your-workers-url.workers.dev/api/feedback`

Should return: `[]` (empty array) or list of feedback

### 3. Check API URL Configuration

In Cloudflare Pages:
1. Go to your Pages project
2. Settings → Environment Variables
3. Verify `VITE_API_URL` is set to your full Workers URL
   - Example: `https://feedback-analysis-api.xxx.workers.dev`
   - **Important:** Must include `https://` and full domain

### 4. Verify Database is Set Up

Check that D1 database exists and has the schema:
```bash
cd worker
wrangler d1 execute feedback-db --file=./schema.sql
```

### 5. Check Workers Logs

In Cloudflare Dashboard:
1. Go to Workers & Pages → Your Worker
2. Click "Logs" tab
3. Try adding feedback again
4. Check for error messages in logs

### 6. Common Issues

#### Issue: "Cannot connect to API"
**Solution:** 
- Verify `VITE_API_URL` is set correctly in Pages
- Make sure Workers is deployed
- Check that Workers URL is accessible

#### Issue: CORS Error
**Solution:**
- Workers already includes CORS headers
- If issue persists, check that request is going to correct URL

#### Issue: "Database not found"
**Solution:**
- Verify `wrangler.toml` has correct `database_id`
- Run: `wrangler d1 execute feedback-db --file=./schema.sql`

#### Issue: "KV namespace not found"
**Solution:**
- This is OK - KV is optional for caching
- Workers will continue without KV
- Verify KV IDs in `wrangler.toml` if you want caching

### 7. Test API Endpoints Directly

```bash
# Test GET
curl https://your-workers-url.workers.dev/api/feedback

# Test POST
curl -X POST https://your-workers-url.workers.dev/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test feedback"}'

# Test Analysis
curl https://your-workers-url.workers.dev/api/analysis
```

### 8. Rebuild and Redeploy

If all else fails:
```bash
# Rebuild frontend
cd frontend
npm run build

# Redeploy Pages
wrangler pages deploy dist --project-name=feedback-analysis

# Or redeploy Workers
cd ../worker
wrangler deploy
```

### 9. Check Network Tab

In browser DevTools:
1. Open Network tab
2. Try adding feedback
3. Look for the POST request to `/api/feedback`
4. Check:
   - Request URL (is it correct?)
   - Request status (200, 400, 500, etc.)
   - Response body (what error message?)

### 10. Enable Detailed Logging

The updated code now shows more detailed error messages. Check:
- Browser console for detailed error
- Error message in the red alert box (should now show specific error)

---

## Still Having Issues?

1. Check that all steps in `QUICK_DEPLOY.md` were completed
2. Verify Workers is accessible: `curl https://your-workers-url.workers.dev`
3. Check Cloudflare Dashboard for any service issues
4. Review Workers logs in Cloudflare Dashboard
