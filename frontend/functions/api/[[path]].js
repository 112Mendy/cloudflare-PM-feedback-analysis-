// Cloudflare Pages Function to proxy API requests to Workers
// This handles POST requests that _redirects might not handle properly

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Only handle /api/* requests
  if (!path.startsWith('/api/')) {
    return new Response('Not Found', { status: 404 });
  }

  // Get Workers URL from environment variable or use default
  // Note: In Pages Functions, env vars are available directly
  const workersUrl = env.VITE_API_URL || 'https://feedback-analysis-api.feedback-analysis-api.workers.dev';
  
  console.log('Pages Function - Workers URL:', workersUrl);
  console.log('Pages Function - Request path:', path);
  
  // Construct the Workers URL
  const workersApiUrl = `${workersUrl}${path}${url.search}`;

  // Forward the request to Workers
  try {
    // Clone headers and remove host header
    const headers = new Headers(request.headers);
    headers.delete('host');
    
    // Get request body if it exists
    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.clone().arrayBuffer();
    }
    
    const response = await fetch(workersApiUrl, {
      method: request.method,
      headers: headers,
      body: body,
    });

    // Create a new response with CORS headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

    return newResponse;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to proxy request', detail: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
