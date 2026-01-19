import React, { useState } from 'react'
import axios from 'axios'
import './FeedbackForm.css'
import { API_BASE_URL } from '../config'

function FeedbackForm({ onFeedbackAdded }) {
  const [formData, setFormData] = useState({
    text: '',
    source: '',
    category: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [batchMode, setBatchMode] = useState(false)
  const [batchText, setBatchText] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (batchMode && batchText.trim()) {
        // Process batch input (one feedback per line)
        const lines = batchText.split('\n').filter(line => line.trim())
        const feedbacks = lines.map(line => ({
          text: line.trim(),
          source: formData.source || 'batch',
          category: formData.category || null,
        }))

        await axios.post(`${API_BASE_URL}/api/feedback/batch`, feedbacks)
        setMessage({ type: 'success', text: `Successfully added ${feedbacks.length} feedback entries!` })
        setBatchText('')
      } else if (formData.text.trim()) {
        await axios.post(`${API_BASE_URL}/api/feedback`, formData)
        setMessage({ type: 'success', text: 'Feedback added successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Please enter feedback text' })
        setLoading(false)
        return
      }

      setFormData({ text: '', source: '', category: '' })
      onFeedbackAdded()
    } catch (error) {
      console.error('Error adding feedback:', error)
      let errorMessage = 'Error adding feedback'
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.detail || 
                      error.response.data?.error || 
                      error.response.data?.message ||
                      `Server error: ${error.response.status} ${error.response.statusText}`
      } else if (error.request) {
        // Request made but no response
        errorMessage = `Cannot connect to API. Check that ${API_BASE_URL} is correct and Workers is deployed.`
      } else {
        // Error setting up request
        errorMessage = `Request error: ${error.message}`
      }
      
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Add Feedback</h2>

      <div className="form-toggle">
        <button
          className={!batchMode ? 'active' : ''}
          onClick={() => setBatchMode(false)}
        >
          Single Entry
        </button>
        <button
          className={batchMode ? 'active' : ''}
          onClick={() => setBatchMode(true)}
        >
          Batch Entry
        </button>
      </div>

      <form onSubmit={handleSubmit} className="feedback-form">
        {!batchMode ? (
          <>
            <div className="form-group">
              <label htmlFor="text">Feedback Text *</label>
              <textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Enter your feedback here..."
                rows="6"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="source">Source</label>
                <input
                  id="source"
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., email, survey, review"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., feature, bug, support"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="batchText">Batch Feedback (one per line) *</label>
              <textarea
                id="batchText"
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="Enter multiple feedback entries, one per line..."
                rows="12"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="batchSource">Source</label>
                <input
                  id="batchSource"
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., csv_import, survey"
                />
              </div>

              <div className="form-group">
                <label htmlFor="batchCategory">Category</label>
                <input
                  id="batchCategory"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., general"
                />
              </div>
            </div>
          </>
        )}

        {message && (
          <div className={message.type === 'success' ? 'success' : 'error'}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Adding...' : batchMode ? 'Add All Feedback' : 'Add Feedback'}
        </button>
      </form>
    </div>
  )
}

export default FeedbackForm
