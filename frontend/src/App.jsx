import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import FeedbackForm from './components/FeedbackForm'
import FeedbackList from './components/FeedbackList'
import Dashboard from './components/Dashboard'
import { API_BASE_URL } from './config'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [feedbacks, setFeedbacks] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/feedback`)
      console.log('API Response:', response)
      console.log('API Response Data:', response.data)
      console.log('Is Array?', Array.isArray(response.data))
      
      // Ensure we have an array
      if (Array.isArray(response.data)) {
        setFeedbacks(response.data)
      } else if (response.data && Array.isArray(response.data.results)) {
        // Handle case where API returns { results: [...] }
        setFeedbacks(response.data.results)
      } else if (response.data && Array.isArray(response.data.data)) {
        // Handle case where API returns { data: [...] }
        setFeedbacks(response.data.data)
      } else {
        console.error('Invalid feedbacks response - not an array:', response.data)
        console.error('Type:', typeof response.data)
        setFeedbacks([])
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      console.error('Error details:', error.response?.data)
      setFeedbacks([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalysis = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/analysis`)
      // Ensure response has the expected structure
      if (response.data) {
        setAnalysis(response.data)
      } else {
        console.error('Invalid analysis response:', response)
        // Set default empty analysis
        setAnalysis({
          total_feedback: 0,
          sentiment_distribution: { positive: 0, negative: 0, neutral: 0 },
          top_keywords: [],
          sources: [],
          average_sentiment_score: 0.0,
          stats: { total: 0, positive: 0, negative: 0, neutral: 0 }
        })
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
      // Set default empty analysis on error
      setAnalysis({
        total_feedback: 0,
        sentiment_distribution: { positive: 0, negative: 0, neutral: 0 },
        top_keywords: [],
        sources: [],
        average_sentiment_score: 0.0,
        stats: { total: 0, positive: 0, negative: 0, neutral: 0 }
      })
    }
  }

  useEffect(() => {
    fetchFeedbacks()
    fetchAnalysis()
  }, [])

  const handleFeedbackAdded = () => {
    fetchFeedbacks()
    fetchAnalysis()
  }

  const handleFeedbackDeleted = () => {
    fetchFeedbacks()
    fetchAnalysis()
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 Feedback Aggregation & Analysis Tool</h1>
        <p>Collect, analyze, and derive insights from feedback</p>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📈 Dashboard
        </button>
        <button
          className={activeTab === 'add' ? 'active' : ''}
          onClick={() => setActiveTab('add')}
        >
          ➕ Add Feedback
        </button>
        <button
          className={activeTab === 'list' ? 'active' : ''}
          onClick={() => setActiveTab('list')}
        >
          📋 All Feedback
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard analysis={analysis} loading={loading} />
        )}
        {activeTab === 'add' && (
          <FeedbackForm onFeedbackAdded={handleFeedbackAdded} />
        )}
        {activeTab === 'list' && (
          <FeedbackList
            feedbacks={feedbacks}
            loading={loading}
            onFeedbackDeleted={handleFeedbackDeleted}
          />
        )}
      </main>
    </div>
  )
}

export default App
