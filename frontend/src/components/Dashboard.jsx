import React from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Dashboard.css'

function Dashboard({ analysis, loading }) {
  if (loading || !analysis) {
    return <div className="loading">Loading analysis...</div>
  }

  // Safely access nested properties with defaults
  const stats = analysis.stats || { total: 0, positive: 0, negative: 0, neutral: 0 }
  const topKeywords = analysis.top_keywords || []
  const sources = analysis.sources || []
  const sentimentScore = analysis.average_sentiment_score || 0

  const sentimentData = [
    { name: 'Positive', value: stats.positive || 0, color: '#4caf50' },
    { name: 'Negative', value: stats.negative || 0, color: '#f44336' },
    { name: 'Neutral', value: stats.neutral || 0, color: '#ff9800' },
  ]

  const topKeywordsData = topKeywords.slice(0, 10).map((item) => ({
    word: item.word,
    count: item.count,
  }))
  const sentimentLabel =
    sentimentScore > 0.1
      ? 'Positive'
      : sentimentScore < -0.1
      ? 'Negative'
      : 'Neutral'

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{analysis.total_feedback || 0}</div>
          <div className="stat-label">Total Feedback</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#4caf50' }}>
            {stats.positive || 0}
          </div>
          <div className="stat-label">Positive</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f44336' }}>
            {stats.negative || 0}
          </div>
          <div className="stat-label">Negative</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ff9800' }}>
            {stats.neutral || 0}
          </div>
          <div className="stat-label">Neutral</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-value"
            style={{
              color:
                sentimentScore > 0.1
                  ? '#4caf50'
                  : sentimentScore < -0.1
                  ? '#f44336'
                  : '#ff9800',
            }}
          >
            {sentimentScore.toFixed(3)}
          </div>
          <div className="stat-label">Avg Sentiment ({sentimentLabel})</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{sources.length || 0}</div>
          <div className="stat-label">Sources</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3>Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Top Keywords</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topKeywordsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="word" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {sources.length > 0 && (
        <div className="card">
          <h3>Feedback Sources</h3>
          <div className="sources-list">
            {sources.map((source, idx) => (
              <span key={idx} className="source-tag">
                {source}
              </span>
            ))}
          </div>
        </div>
      )}

      {topKeywords.length > 0 && (
        <div className="card">
          <h3>All Keywords</h3>
          <div className="keywords-cloud">
            {topKeywords.map((item, idx) => (
              <span
                key={idx}
                className="keyword-cloud-item"
                style={{
                  fontSize: `${Math.min(16 + item.count * 2, 24)}px`,
                  opacity: Math.min(0.5 + item.count / 20, 1),
                }}
              >
                {item.word} ({item.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
