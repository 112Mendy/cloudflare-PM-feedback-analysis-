# Architecture Overview & Product Selection Rationale

## Cloudflare Products Used

This prototype uses **4 Cloudflare Developer Platform products**:

1. **Cloudflare Workers** (Required) - Serverless backend API
2. **Cloudflare D1** - Serverless SQLite database
3. **Cloudflare Pages** - Frontend hosting and CDN
4. **Cloudflare KV** - Edge caching layer

## Why These Products?

### 1. Cloudflare Workers (Required)

**Why Workers?**
- **Edge Computing**: Runs at 300+ locations worldwide, ensuring low latency for all users
- **Serverless**: No server management, auto-scales based on demand
- **Fast Cold Starts**: JavaScript runtime optimized for quick response times
- **Cost-Effective**: Generous free tier (100K requests/day)
- **Perfect for APIs**: Ideal for RESTful API endpoints that need to process and analyze data

**Use Case in Prototype:**
- Handles all API endpoints (`/api/feedback`, `/api/analysis`, etc.)
- Performs sentiment analysis and keyword extraction
- Manages database operations via D1 bindings
- Implements caching with KV bindings

**Alternative Considered:** None (required by assignment)

---

### 2. Cloudflare D1 (Database)

**Why D1?**
- **Serverless SQL**: No database server to manage or configure
- **SQLite Compatible**: Familiar SQL syntax, easy to work with
- **Seamless Integration**: Direct bindings to Workers via `env.DB`
- **Global Replication**: Data replicated across Cloudflare's network
- **Cost-Effective**: 5GB storage, 5M reads/month on free tier
- **Perfect for Structured Data**: Feedback entries with metadata fit perfectly into relational model

**Use Case in Prototype:**
- Stores all feedback entries with metadata (text, source, category, sentiment, keywords)
- Enables fast queries with indexes (by source, sentiment, date)
- Supports filtering and aggregation for analysis endpoints

**Alternatives Considered:**
- **KV**: Too limited for complex queries and relationships
- **R2**: Better for unstructured data, not ideal for querying feedback entries
- **External Database**: Would add complexity and latency

**Decision:** D1 is the clear choice for structured feedback data that needs querying and filtering.

---

### 3. Cloudflare Pages (Frontend Hosting)

**Why Pages?**
- **JAMstack Hosting**: Perfect for React static sites
- **Global CDN**: Content delivered from edge locations worldwide
- **Automatic Deployments**: Git integration for CI/CD
- **Free SSL**: Automatic HTTPS certificates
- **Zero Configuration**: Works out of the box with React/Vite builds
- **Cost-Effective**: Unlimited requests on free tier

**Use Case in Prototype:**
- Hosts the React frontend application
- Serves static assets (HTML, CSS, JS) with optimal caching
- Proxies API requests to Workers via `_redirects` file
- Provides preview deployments for testing

**Alternatives Considered:**
- **Workers for Frontend**: Possible but Pages is purpose-built for static sites
- **External Hosting**: Would lose CDN benefits and integration with Workers

**Decision:** Pages is the optimal choice for hosting a React frontend that needs to communicate with Workers API.

---

### 4. Cloudflare KV (Caching)

**Why KV?**
- **Edge Caching**: Store frequently accessed data at the edge
- **Low Latency**: Sub-millisecond read times
- **Cost-Effective**: 100K reads/day on free tier
- **Simple API**: Easy key-value operations
- **Perfect for Analysis Results**: Dashboard analysis queries are expensive (aggregate all feedback), so caching makes sense

**Use Case in Prototype:**
- Caches aggregate analysis results for 5 minutes
- Reduces D1 query load for dashboard requests
- Automatically invalidated when new feedback is added
- Improves user experience with faster dashboard loads

**Alternatives Considered:**
- **No Caching**: Would work but dashboard would be slower
- **D1 Caching**: Not a feature, would need to implement manually
- **Workers Cache API**: More complex, KV is simpler for this use case

**Decision:** KV provides simple, effective caching for expensive analysis queries.

---

## Products NOT Used (And Why)

### Workers AI
**Why Not Used:**
- **Mock Data Requirement**: Assignment explicitly allows mock data, so no need for real AI
- **Complexity**: Would add setup complexity for a prototype
- **Cost**: Might exceed free tier for sentiment analysis
- **Overkill**: Simple keyword-based sentiment analysis is sufficient for prototype

**When Would I Use It:**
- If I needed real AI-powered sentiment analysis
- For summarizing long feedback threads
- For advanced topic modeling

### Workflows
**Why Not Used:**
- **Scope**: Prototype is simple enough that Workers alone handle the logic
- **Complexity**: Workflows are for multi-step, stateful processes
- **Not Needed**: Current flow (Receive → Analyze → Store) is straightforward

**When Would I Use It:**
- If I needed to orchestrate complex pipelines (e.g., Receive → Analyze → Notify Slack → Update Dashboard)
- For scheduled batch processing
- For multi-step approval workflows

### AI Search
**Why Not Used:**
- **Mock Data**: No need for semantic search with mock data
- **Scope**: Keyword extraction and filtering is sufficient for prototype
- **Complexity**: Adds setup overhead

**When Would I Use It:**
- If I needed to find "similar" feedback entries semantically
- For advanced theme detection across feedback
- For natural language queries ("show me all complaints about login")

### R2 (Object Storage)
**Why Not Used:**
- **Data Type**: Feedback is structured text, not files
- **Not Needed**: No file uploads or attachments in prototype

**When Would I Use It:**
- If feedback included file attachments (images, PDFs)
- For storing exported reports
- For archiving old feedback data

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Pages (Frontend)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Application (Static Assets)                   │   │
│  │  - Dashboard, Forms, Lists                           │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ API Requests (/api/*)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            Cloudflare Workers (Backend API)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Endpoints:                                        │  │
│  │  - GET/POST /api/feedback                             │  │
│  │  - GET /api/analysis                                  │  │
│  │  - DELETE /api/feedback/:id                           │  │
│  └───────┬───────────────────────────────┬─────────────────┘  │
│          │                               │                    │
│          │ Read/Write                    │ Read/Write        │
│          ▼                               ▼                    │
│  ┌──────────────┐              ┌──────────────┐             │
│  │ Cloudflare D1│              │ Cloudflare KV│             │
│  │  (Database)  │              │   (Cache)    │             │
│  │              │              │              │             │
│  │ - feedback   │              │ - analysis   │             │
│  │   table      │              │   results    │             │
│  └──────────────┘              └──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Adding Feedback
1. User submits feedback via React frontend (Pages)
2. Frontend sends POST to `/api/feedback`
3. Request routed to Cloudflare Workers
4. Worker analyzes sentiment and extracts keywords (mock analysis)
5. Worker stores data in D1 database
6. Worker invalidates KV cache
7. Response returned to frontend

### Viewing Analysis
1. User navigates to Dashboard (Pages)
2. Frontend requests `/api/analysis`
3. Worker checks KV cache first
4. If cache miss, queries D1 for all feedback
5. Worker calculates aggregate statistics
6. Worker stores result in KV (5 min TTL)
7. Response returned to frontend

## Why This Architecture Works

### Performance
- **Edge Computing**: Workers run close to users globally
- **Caching**: KV reduces database load for frequent queries
- **CDN**: Pages serves static assets from edge locations

### Scalability
- **Auto-Scaling**: Workers and D1 scale automatically
- **No Server Management**: Fully serverless architecture
- **Global Distribution**: All services distributed worldwide

### Cost
- **Generous Free Tiers**: All services have free tiers
- **Pay-as-You-Go**: Only pay for what you use
- **No Infrastructure Costs**: No servers to maintain

### Developer Experience
- **Simple Deployment**: `wrangler deploy` for Workers, Git push for Pages
- **Local Development**: Wrangler CLI for local testing
- **Integrated Services**: Bindings make integration seamless

## Screenshot Reference

See the Workers dashboard "Bindings" page which shows:
- **D1 Binding**: `DB` → `feedback-db` database
- **KV Binding**: `CACHE` → KV namespace for caching

This visual confirmation shows how Workers connects to other Cloudflare products via bindings.
