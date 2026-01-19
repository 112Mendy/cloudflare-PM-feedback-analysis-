# Architecture Overview

## Cloudflare Developer Platform Products Used

This Feedback Aggregation & Analysis Tool leverages **3 Cloudflare Developer Platform products** to create a scalable, serverless application:

### 1. **Cloudflare Workers** 🚀
**Purpose**: Serverless backend API

**Why Workers?**
- **Edge Computing**: Runs at Cloudflare's edge network for low latency globally
- **Serverless**: No server management, auto-scales based on demand
- **Cost-Effective**: Pay only for what you use
- **Fast Cold Starts**: JavaScript runtime optimized for quick response times
- **Built-in Features**: CORS handling, request routing, and environment bindings

**Implementation**: 
- Handles all API endpoints (`/api/feedback`, `/api/analysis`, etc.)
- Performs sentiment analysis and keyword extraction
- Manages database operations via D1 bindings
- Implements caching with KV bindings

### 2. **Cloudflare D1** 💾
**Purpose**: Serverless SQLite database

**Why D1?**
- **Serverless SQL**: No database server to manage
- **SQLite Compatible**: Familiar SQL syntax, easy migrations
- **Global Replication**: Data replicated across Cloudflare's network
- **Zero Configuration**: Works seamlessly with Workers via bindings
- **Cost-Effective**: Generous free tier, pay for storage and queries

**Implementation**:
- Stores all feedback entries with metadata
- Indexed queries for fast filtering (by source, sentiment, date)
- Automatic schema management via migrations
- Direct SQL queries from Workers

**Schema**:
```sql
feedback (
  id, text, source, category, 
  sentiment, sentiment_score, 
  keywords, metadata, created_at
)
```

### 3. **Cloudflare Pages** 🌐
**Purpose**: Frontend hosting and deployment

**Why Pages?**
- **JAMstack Hosting**: Perfect for React static sites
- **Global CDN**: Content delivered from edge locations worldwide
- **Automatic Deployments**: Git integration for CI/CD
- **Preview Deployments**: Test changes before production
- **Free SSL**: Automatic HTTPS certificates
- **Custom Domains**: Easy domain configuration

**Implementation**:
- Hosts the React frontend application
- Serves static assets (HTML, CSS, JS)
- Proxies API requests to Workers via `_redirects`
- Environment variable support for configuration

### 4. **Cloudflare KV** (Bonus) ⚡
**Purpose**: Caching layer for analysis results

**Why KV?**
- **Edge Caching**: Store frequently accessed data at the edge
- **Low Latency**: Sub-millisecond read times
- **Cost-Effective**: Reduces database queries
- **Simple API**: Easy key-value operations

**Implementation**:
- Caches aggregate analysis results for 5 minutes
- Reduces D1 query load for dashboard requests
- Automatically invalidated when new feedback is added

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
2. Frontend sends POST request to `/api/feedback`
3. Request routed to Cloudflare Workers
4. Worker analyzes sentiment and extracts keywords
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

## Benefits of This Architecture

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

## Deployment

### Workers (Backend)
```bash
cd worker
wrangler deploy
```

### Pages (Frontend)
```bash
cd frontend
npm run build
# Connect GitHub repo to Cloudflare Pages dashboard
# Or use Wrangler:
wrangler pages deploy dist
```

### D1 Database
```bash
wrangler d1 create feedback-db
wrangler d1 execute feedback-db --file=./schema.sql
```

### KV Namespace
```bash
wrangler kv:namespace create CACHE
```

## Environment Variables

### Workers
- Set in `wrangler.toml` or Cloudflare Dashboard
- D1 and KV bindings configured via `wrangler.toml`

### Pages
- Set in Cloudflare Pages dashboard
- `VITE_API_URL`: URL of deployed Workers API

## Mock Data

The application uses mock data for:
- **Sentiment Analysis**: Simple keyword-based sentiment scoring
- **Keyword Extraction**: Basic word frequency analysis

No real third-party integrations required - all analysis is performed locally in Workers.
