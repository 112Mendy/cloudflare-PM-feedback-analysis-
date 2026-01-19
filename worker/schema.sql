-- Cloudflare D1 Database Schema for Feedback Analysis Tool

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  category TEXT,
  sentiment TEXT,
  sentiment_score REAL,
  keywords TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_created_at ON feedback(created_at);
