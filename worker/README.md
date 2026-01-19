# Cloudflare Workers Backend

This is the Cloudflare Workers backend for the Feedback Analysis Tool.

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create D1 Database

```bash
wrangler d1 create feedback-db
```

This will output a database ID. Update `wrangler.toml` with the database ID.

### 4. Run Database Migration

```bash
wrangler d1 execute feedback-db --file=./schema.sql
```

### 5. Create KV Namespace

```bash
wrangler kv namespace create CACHE
```

Update `wrangler.toml` with the KV namespace IDs.

### 6. Local Development

```bash
npm run dev
```

### 7. Deploy

```bash
npm run deploy
```

## Environment Variables

Update `wrangler.toml` with your actual D1 database ID and KV namespace IDs after creating them.
