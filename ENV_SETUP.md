# Environment Variable Setup Guide

## Setting VITE_API_URL in Cloudflare Pages

### Step-by-Step Instructions

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Login to your account

2. **Navigate to Pages**
   - Click "Workers & Pages" in the left sidebar
   - Click on your Pages project (e.g., `feedback-analysis`)

3. **Go to Settings**
   - Click the "Settings" tab at the top

4. **Environment Variables Section**
   - Scroll down to "Environment Variables"
   - Click "Add variable"

5. **Add the Variable**
   - **Variable name:** `VITE_API_URL`
   - **Value:** `https://feedback-analysis-api.feedback-analysis-api.workers.dev`
     - ⚠️ Replace with your actual Workers URL
     - ⚠️ Must include `https://`
     - ⚠️ No trailing slash
   - **Environment:** Select "Production" (and "Preview" if you want)

6. **Save**
   - Click "Save" button

### Important Notes

- **Variable name is case-sensitive:** Must be exactly `VITE_API_URL`
- **Vite prefix required:** The `VITE_` prefix is required for Vite to expose it to the frontend
- **Rebuild required:** After setting the variable, you MUST rebuild and redeploy Pages
- **Check both environments:** Set for both Production and Preview if needed

### After Setting the Variable

1. **Rebuild your frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Redeploy to Pages:**
   - If using Git: Push to trigger auto-deploy
   - If using manual upload: Upload the new `dist` folder

3. **Verify it's working:**
   - Open browser console
   - Should see: `API Base URL: https://feedback-analysis-api.feedback-analysis-api.workers.dev`
   - Should NOT see the warning message

### Troubleshooting

**Still seeing the warning?**
- Make sure variable name is exactly `VITE_API_URL` (case-sensitive)
- Make sure you rebuilt after setting the variable
- Check that you set it for the correct environment (Production/Preview)
- Try clearing browser cache

**Getting 405 errors?**
- Check that your Workers URL is correct
- Verify Workers is deployed and accessible
- Check the `_redirects` file is updated with correct URL

### Alternative: Use _redirects File

If you can't set environment variables, you can use the `_redirects` file instead:
- Update `frontend/_redirects` with your Workers URL
- Rebuild and redeploy
- This proxies `/api/*` requests to your Workers
