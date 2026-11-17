# Feedback Aggregation & Analysis Tool

A full-stack web application for collecting, aggregating, and analyzing feedback to derive meaningful insights.

## Features

- **Feedback Collection**: Add single or batch feedback entries
- **Sentiment Analysis**: Automatically analyzes sentiment (positive/negative/neutral) with scores
- **Keyword Extraction**: Identifies and extracts key terms from feedback
- **Data Visualization**: Interactive charts and graphs showing:
  - Sentiment distribution (pie chart)
  - Top keywords (bar chart)
  - Statistics dashboard
- **Filtering & Search**: Filter feedback by source and sentiment
- **Batch Import**: Import multiple feedback entries at once
- **RESTful API**: Complete backend API for programmatic access

## Tech Stack

### Cloudflare Developer Platform (Production)
- **Cloudflare Workers** - Serverless backend API (edge computing)
- **Cloudflare D1** - Serverless SQLite database
- **Cloudflare Pages** - Frontend hosting and CDN
- **Cloudflare KV** - Edge caching for analysis results

### Local Development (Alternative)
- **FastAPI** - Python web framework (backend alternative)
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Local database
- **TextBlob/NLTK** - Natural language processing

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Recharts** - Charting library for visualizations
- **Axios** - HTTP client for API calls

## Cloudflare Architecture

This application uses **3 Cloudflare Developer Platform products**:

1. **Cloudflare Workers** - Serverless backend API that handles all requests, performs sentiment analysis, and manages data operations
2. **Cloudflare D1** - Serverless SQLite database for storing feedback entries
3. **Cloudflare Pages** - Hosts the React frontend with global CDN distribution
4. **Cloudflare KV** (Bonus) - Caches analysis results for improved performance

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture overview and deployment instructions.

## Project Structure

```
.
├── worker/                  # Cloudflare Workers backend
│   ├── src/
│   │   └── index.js        # Workers API implementation
│   ├── schema.sql          # D1 database schema
│   ├── wrangler.toml       # Workers configuration
│   └── package.json        # Workers dependencies
├── backend/                 # FastAPI backend (local dev alternative)
│   ├── main.py             # FastAPI application
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── analysis_engine.py  # Sentiment analysis & keyword extraction
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx         # Main app component
│   │   ├── config.js       # API configuration
│   │   └── main.jsx        # Entry point
│   ├── _redirects         # Cloudflare Pages redirects
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
├── ARCHITECTURE.md         # Detailed architecture documentation
└── README.md
```

## Setup Instructions

### Option 1: Cloudflare Platform (Recommended)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed Cloudflare deployment instructions.

**Quick Start:**
```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Setup D1 Database
cd worker
wrangler d1 create feedback-db
wrangler d1 execute feedback-db --file=./schema.sql

# 3. Setup KV Namespace
wrangler kv namespace create CACHE

# 4. Update wrangler.toml with your IDs

# 5. Deploy Workers
wrangler deploy

# 6. Deploy Frontend to Pages
cd ../frontend
npm run build
wrangler pages deploy dist
```

### Option 2: Local Development (FastAPI)

### Prerequisites

- Python 3.8+ installed
- Node.js 16+ and npm installed

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **Mac/Linux**: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Download NLTK data (required for text processing):
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('averaged_perceptron_tagger')"
```

6. Start the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`
API documentation (Swagger UI) at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### Adding Feedback

1. Click on "Add Feedback" tab
2. Enter feedback text
3. Optionally specify source and category
4. Click "Add Feedback"

### Batch Import

1. Go to "Add Feedback" tab
2. Switch to "Batch Entry" mode
3. Paste multiple feedback entries (one per line)
4. Click "Add All Feedback"

### Viewing Analysis

1. Go to "Dashboard" tab to see:
   - Total feedback count
   - Sentiment distribution
   - Top keywords
   - Average sentiment score
   - Visual charts

### Filtering Feedback

1. Go to "All Feedback" tab
2. Use the filter dropdowns to filter by:
   - Source
   - Sentiment

## API Endpoints

- `GET /api/feedback` - Get all feedback (with optional filters)
- `POST /api/feedback` - Create a new feedback entry
- `POST /api/feedback/batch` - Create multiple feedback entries
- `GET /api/feedback/{id}` - Get a specific feedback entry
- `DELETE /api/feedback/{id}` - Delete a feedback entry
- `GET /api/analysis` - Get aggregate analysis
- `GET /api/stats` - Get basic statistics

See `http://localhost:8000/docs` for interactive API documentation.

## Analysis Features

### Sentiment Analysis
- Uses TextBlob's sentiment analysis
- Scores range from -1 (very negative) to +1 (very positive)
- Categorizes as: positive (>0.1), negative (<-0.1), neutral (otherwise)

### Keyword Extraction
- Extracts nouns and adjectives
- Filters out common stop words
- Ranks keywords by frequency
- Shows top keywords in dashboard

## Future Enhancements

- Export feedback to CSV/JSON
- Advanced topic modeling
- Time-series analysis
- User authentication
- Multi-language support
- Integration with external feedback sources (APIs, webhooks)
- Email notifications
- Custom categorization rules

## FeedCus.ai — Product Demonstration

FeedCus.ai is an AI-powered product feedback intelligence platform designed to help product teams aggregate fragmented customer feedback, identify product gaps, analyse customer sentiment, prioritise improvements and make better product decisions.

▶️ **[Watch the FeedCus.ai product demonstration (3 min 20 s)](./assets/feedcus-demo.mp4)**

<video src="./assets/feedcus-demo.mp4" controls width="100%"></video>

## License

MIT
