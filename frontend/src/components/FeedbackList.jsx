import React, { useState } from 'react'
import axios from 'axios'
import './FeedbackList.css'
import { API_BASE_URL } from '../config'

function FeedbackList({ feedbacks, loading, onFeedbackDeleted }) {
  const [filterSource, setFilterSource] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('')
  
  // Early validation - ensure feedbacks is an array
  if (!Array.isArray(feedbacks) && feedbacks !== undefined && feedbacks !== null) {
    console.error('FeedbackList received non-array feedbacks:', feedbacks)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/feedback/${id}`)
        onFeedbackDeleted()
      } catch (error) {
        console.error('Error deleting feedback:', error)
        alert('Error deleting feedback')
      }
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return '#4caf50'
      case 'negative':
        return '#f44336'
      case 'neutral':
        return '#ff9800'
      default:
        return '#666'
    }
  }

  // Safely handle undefined/null/non-array feedbacks
  // Ensure feedbacks is always an array
  const safeFeedbacks = Array.isArray(feedbacks) ? feedbacks : []
  
  const filteredFeedbacks = safeFeedbacks.filter((fb) => {
    if (!fb) return false
    if (filterSource && fb.source !== filterSource) return false
    if (filterSentiment && fb.sentiment !== filterSentiment) return false
    return true
  })

  const uniqueSources = [...new Set(safeFeedbacks.map((fb) => fb?.source).filter(Boolean))]

  if (loading) {
    return <div className="loading">Loading feedback...</div>
  }

  // Debug: Log feedbacks to console
  console.log('FeedbackList - feedbacks:', feedbacks)
  console.log('FeedbackList - safeFeedbacks:', safeFeedbacks)
  console.log('FeedbackList - filteredFeedbacks:', filteredFeedbacks)

  return (
    <div className="card">
      <h2>All Feedback ({filteredFeedbacks.length})</h2>

      <div className="filters">
        <div className="filter-group">
          <label>Filter by Source:</label>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
          >
            <option value="">All Sources</option>
            {uniqueSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Sentiment:</label>
          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
          >
            <option value="">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
      </div>

      {filteredFeedbacks.length === 0 ? (
        <div className="empty-state">
          <p>No feedback found. Add some feedback to get started!</p>
        </div>
      ) : (
        <div className="feedback-list">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.id} className="feedback-item">
              <div className="feedback-header">
                <div className="feedback-meta">
                  <span className="feedback-id">#{feedback.id}</span>
                  {feedback.source && (
                    <span className="feedback-source">{feedback.source}</span>
                  )}
                  {feedback.category && (
                    <span className="feedback-category">{feedback.category}</span>
                  )}
                  <span
                    className="feedback-sentiment"
                    style={{ color: getSentimentColor(feedback.sentiment) }}
                  >
                    {feedback.sentiment || 'unknown'} ({feedback.sentiment_score ? feedback.sentiment_score.toFixed(2) : '0.00'})
                  </span>
                </div>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(feedback.id)}
                >
                  🗑️ Delete
                </button>
              </div>

              <p className="feedback-text">{feedback.text || 'No text'}</p>

              {feedback.keywords && Array.isArray(feedback.keywords) && feedback.keywords.length > 0 && (
                <div className="feedback-keywords">
                  <strong>Keywords:</strong>
                  {feedback.keywords.map((keyword, idx) => (
                    <span key={idx} className="keyword-tag">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              <div className="feedback-footer">
                <span className="feedback-date">
                  {feedback.created_at ? new Date(feedback.created_at).toLocaleString() : 'No date'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FeedbackList
