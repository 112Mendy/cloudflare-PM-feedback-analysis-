// API Configuration
// For Cloudflare Pages deployment, set VITE_API_URL in environment variables
// For local development with Workers, use: http://localhost:8787
// For local development with FastAPI, use: http://localhost:8000

const getApiUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL
    // Remove trailing slash if present
    return url.endsWith('/') ? url.slice(0, -1) : url
  }
  
  // Development mode - use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:8787'
  }
  
  // Production - use relative path (will be proxied by Pages Function)
  // Return empty string so code can use /api/feedback directly
  // The Pages Function in functions/api/[[path]].js will handle the proxying
  console.warn('⚠️ VITE_API_URL not set at build time!')
  console.warn('💡 Option 1: Set VITE_API_URL in Pages env vars and rebuild for direct Workers access')
  console.warn('💡 Option 2: Using relative path /api (Pages Function will proxy to Workers)')
  return ''
}

export const API_BASE_URL = getApiUrl()

// Log API URL for debugging
console.log('API Base URL:', API_BASE_URL || '(empty - using relative paths)')
console.log('VITE_API_URL env var:', import.meta.env.VITE_API_URL)
console.log('Is DEV mode:', import.meta.env.DEV)
console.log('Mode:', import.meta.env.MODE)