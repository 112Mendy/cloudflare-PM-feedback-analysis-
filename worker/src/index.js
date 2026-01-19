/**
 * Cloudflare Workers backend for Feedback Aggregation & Analysis Tool
 * Uses Cloudflare D1 (database) and KV (caching)
 */

// Simple sentiment analysis (mock implementation)
function analyzeSentiment(text) {
  const positiveWords = ['love', 'great', 'excellent', 'amazing', 'wonderful', 'good', 'perfect', 'awesome', 'fantastic', 'best'];
  const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'worst', 'horrible', 'disappointed', 'poor', 'fail', 'broken'];
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  const score = (positiveCount - negativeCount) / Math.max(text.split(' ').length, 1);
  
  let sentiment = 'neutral';
  if (score > 0.1) sentiment = 'positive';
  else if (score < -0.1) sentiment = 'negative';
  
  return {
    sentiment,
    sentiment_score: Math.max(-1, Math.min(1, score))
  };
}

// Extract keywords (simple implementation)
function extractKeywords(text) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'this', 'that', 'it', 'i', 'you', 'he', 'she', 'we', 'they']);
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const keywords = words.filter(word => !stopWords.has(word));
  const counts = {};
  keywords.forEach(word => {
    counts[word] = (counts[word] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// Initialize database schema
async function initDatabase(db) {
  try {
    // Create table
    await db.prepare(`
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
      )
    `).run();
    
    // Create indexes
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_source ON feedback(source)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sentiment ON feedback(sentiment)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_created_at ON feedback(created_at)`).run();
  } catch (error) {
    // Table might already exist, that's OK
    console.log('Database initialization:', error.message);
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      const url = new URL(request.url);
      const path = url.pathname;

      // Check if DB binding exists
      if (!env.DB) {
        return jsonResponse({ 
          error: 'Database binding not configured',
          detail: 'D1 database binding "DB" is missing. Check wrangler.toml configuration.'
        }, 500);
      }

      // Initialize database (with error handling)
      try {
        await initDatabase(env.DB);
      } catch (error) {
        console.error('Database initialization error:', error);
        // Continue anyway - table might already exist
      }

    // Route handling
    if (path === '/' || path === '/api') {
      return jsonResponse({ message: 'Feedback Aggregation & Analysis API - Powered by Cloudflare Workers' });
    }

    // Get all feedback
    if (path === '/api/feedback' && request.method === 'GET') {
      const source = url.searchParams.get('source');
      const sentiment = url.searchParams.get('sentiment');
      const skip = parseInt(url.searchParams.get('skip') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '100');

      let query = 'SELECT * FROM feedback WHERE 1=1';
      const params = [];

      if (source) {
        query += ' AND source = ?';
        params.push(source);
      }
      if (sentiment) {
        query += ' AND sentiment = ?';
        params.push(sentiment);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, skip);

      const result = await env.DB.prepare(query).bind(...params).all();
      // Format response to match frontend expectations
      const formatted = result.results.map(fb => ({
        ...fb,
        keywords: fb.keywords ? fb.keywords.split(', ') : [],
        metadata: fb.metadata ? JSON.parse(fb.metadata) : null
      }));
      return jsonResponse(formatted);
    }

    // Get single feedback
    if (path.startsWith('/api/feedback/') && request.method === 'GET') {
      const id = path.split('/').pop();
      const result = await env.DB.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();
      
      if (!result) {
        return jsonResponse({ error: 'Feedback not found' }, 404);
      }
      // Format response
      return jsonResponse({
        ...result,
        keywords: result.keywords ? result.keywords.split(', ') : [],
        metadata: result.metadata ? JSON.parse(result.metadata) : null
      });
    }

    // Batch endpoint
    if (path === '/api/feedback/batch' && request.method === 'POST') {
      const body = await request.json();
      if (!Array.isArray(body)) {
        return jsonResponse({ error: 'Expected array of feedback items' }, 400);
      }
      
      const results = [];
      for (const item of body) {
        const analysis = analyzeSentiment(item.text);
        const keywords = extractKeywords(item.text);
        
        const result = await env.DB.prepare(
          'INSERT INTO feedback (text, source, category, sentiment, sentiment_score, keywords, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          item.text,
          item.source || 'batch',
          item.category || null,
          analysis.sentiment,
          analysis.sentiment_score,
          keywords.join(', '),
          item.metadata ? JSON.stringify(item.metadata) : null
        ).run();
        
        const inserted = await env.DB.prepare('SELECT * FROM feedback WHERE id = ?').bind(result.meta.last_row_id).first();
        results.push({
          ...inserted,
          keywords: inserted.keywords ? inserted.keywords.split(', ') : [],
          metadata: inserted.metadata ? JSON.parse(inserted.metadata) : null
        });
      }
      
      // Invalidate cache (if KV is available)
      try {
        await env.CACHE.delete('analysis');
      } catch (e) {
        // KV might not be configured
      }
      
      return jsonResponse(results, 201);
    }

    // Create single feedback
    if (path === '/api/feedback' && request.method === 'POST') {
      try {
        const body = await request.json();
        
        if (!body.text || !body.text.trim()) {
          return jsonResponse({ error: 'Feedback text is required' }, 400);
        }
        
        const analysis = analyzeSentiment(body.text);
        const keywords = extractKeywords(body.text);
        
        const result = await env.DB.prepare(
          'INSERT INTO feedback (text, source, category, sentiment, sentiment_score, keywords, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          body.text,
          body.source || 'manual',
          body.category || null,
          analysis.sentiment,
          analysis.sentiment_score,
          keywords.join(', '),
          body.metadata ? JSON.stringify(body.metadata) : null
        ).run();
        
        const inserted = await env.DB.prepare('SELECT * FROM feedback WHERE id = ?').bind(result.meta.last_row_id).first();
        
        // Invalidate cache (if KV is available)
        try {
          await env.CACHE.delete('analysis');
        } catch (e) {
          // KV might not be configured
        }
        
        return jsonResponse({
          ...inserted,
          keywords: inserted.keywords ? inserted.keywords.split(', ') : [],
          metadata: inserted.metadata ? JSON.parse(inserted.metadata) : null
        }, 201);
      } catch (error) {
        console.error('Error creating feedback:', error);
        return jsonResponse({ 
          error: 'Failed to create feedback', 
          detail: error.message 
        }, 500);
      }
    }

    // Delete feedback
    if (path.startsWith('/api/feedback/') && request.method === 'DELETE') {
      const id = path.split('/').pop();
      const result = await env.DB.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run();
      
      if (result.meta.changes === 0) {
        return jsonResponse({ error: 'Feedback not found' }, 404);
      }
      
      // Invalidate cache
      await env.CACHE.delete('analysis');
      
      return jsonResponse({ message: 'Feedback deleted successfully' });
    }

    // Get analysis (with caching)
    if (path === '/api/analysis' && request.method === 'GET') {
      const source = url.searchParams.get('source');
      
      // Check cache (if KV is available)
      const cacheKey = `analysis:${source || 'all'}`;
      try {
        const cached = await env.CACHE.get(cacheKey);
        if (cached) {
          return jsonResponse(JSON.parse(cached));
        }
      } catch (e) {
        // KV might not be configured, continue without cache
      }
      
      let query = 'SELECT * FROM feedback';
      const params = [];
      
      if (source) {
        query += ' WHERE source = ?';
        params.push(source);
      }
      
      const result = await env.DB.prepare(query).bind(...params).all();
      const feedbacks = result.results;
      
      if (feedbacks.length === 0) {
        const emptyAnalysis = {
          total_feedback: 0,
          sentiment_distribution: { positive: 0, negative: 0, neutral: 0 },
          top_keywords: [],
          sources: [],
          average_sentiment_score: 0.0,
          stats: { total: 0, positive: 0, negative: 0, neutral: 0 }
        };
        return jsonResponse(emptyAnalysis);
      }
      
      // Calculate aggregate analysis
      const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
      let totalScore = 0;
      const allKeywords = {};
      const sources = new Set();
      
      feedbacks.forEach(fb => {
        sentimentCounts[fb.sentiment]++;
        totalScore += fb.sentiment_score;
        sources.add(fb.source);
        
        if (fb.keywords) {
          fb.keywords.split(', ').forEach(kw => {
            allKeywords[kw] = (allKeywords[kw] || 0) + 1;
          });
        }
      });
      
      const topKeywords = Object.entries(allKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ word, count }));
      
      const analysis = {
        total_feedback: feedbacks.length,
        sentiment_distribution: sentimentCounts,
        top_keywords: topKeywords,
        sources: Array.from(sources),
        average_sentiment_score: totalScore / feedbacks.length,
        stats: {
          total: feedbacks.length,
          positive: sentimentCounts.positive,
          negative: sentimentCounts.negative,
          neutral: sentimentCounts.neutral
        }
      };
      
      // Cache for 5 minutes (if KV is available)
      try {
        await env.CACHE.put(cacheKey, JSON.stringify(analysis), { expirationTtl: 300 });
      } catch (e) {
        // KV might not be configured, continue without caching
        console.log('KV cache not available');
      }
      
      return jsonResponse(analysis);
    }

    // Get stats
    if (path === '/api/stats' && request.method === 'GET') {
      const source = url.searchParams.get('source');
      
      let query = 'SELECT sentiment, COUNT(*) as count FROM feedback';
      const params = [];
      
      if (source) {
        query += ' WHERE source = ?';
        params.push(source);
      }
      
      query += ' GROUP BY sentiment';
      
      const result = await env.DB.prepare(query).bind(...params).all();
      const stats = { total: 0, positive: 0, negative: 0, neutral: 0 };
      
      result.results.forEach(row => {
        stats[row.sentiment] = row.count;
        stats.total += row.count;
      });
      
      return jsonResponse(stats);
    }

    return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      // Catch any unhandled errors
      console.error('Unhandled error in Worker:', error);
      return jsonResponse({ 
        error: 'Internal server error',
        detail: error.message
      }, 500);
    }
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
