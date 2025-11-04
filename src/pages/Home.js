import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { getAuthToken } from '../config/supabaseClient';
import ProgressSteps from '../components/ProgressSteps';
import ContextSummary from '../components/ContextSummary';
import SourceList from '../components/SourceList';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ step: '', percentage: 0 });
  const [context, setContext] = useState(null);
  const [sources, setSources] = useState([]);
  const [contextId, setContextId] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setContext(null);
    setSources([]);
    setContextId(null);

    // Progress simulation
    const progressSteps = [
      { step: 'Searching', percentage: 25 },
      { step: 'Crawling', percentage: 50 },
      { step: 'Extracting', percentage: 75 },
      { step: 'Summarizing', percentage: 90 }
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setProgress(progressSteps[stepIndex]);
        stepIndex++;
      }
    }, 1500);

    try {
      const token = await getAuthToken();
      
      // Call search-extract endpoint
      const response = await axios.post(
        `${API_BASE_URL}/api/search-extract`,
        {
          query: query,
          options: { max_urls: 5 }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      clearInterval(progressInterval);
      setProgress({ step: 'Complete', percentage: 100 });

      // Handle response
      const { context_id, summary, sources: extractedSources } = response.data;
      
      setContextId(context_id);
      setContext(summary);
      setSources(extractedSources || []);
      
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Search error:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to extract context. Please try again.');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setProgress({ step: '', percentage: 0 }), 500);
    }
  };

  const handleOpenInGenerator = () => {
    if (contextId) {
      navigate(`/generate?contextId=${contextId}`);
    }
  };

  const handleDownloadContext = () => {
    const data = {
      contextId,
      query,
      summary: context,
      sources,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `context_${contextId || 'data'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">Search & Extract Context</h1>
        <p className="hero-subtitle">Search the web, extract context, and prepare for article generation</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-box-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            className="search-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={loading || !query.trim()}
          >
            {loading ? 'Searching...' : 'Search & Extract'}
          </button>
        </div>
      </form>

      {loading && (
        <ProgressSteps 
          currentStep={progress.step}
          percentage={progress.percentage}
        />
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          {error.includes('Authentication') && (
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Refresh Page
            </button>
          )}
        </div>
      )}

      {context && !loading && (
        <div className="results-container">
          <ContextSummary 
            summary={context}
            contextId={contextId}
            timestamp={new Date().toISOString()}
          />

          <SourceList 
            sources={sources}
          />

          <div className="action-buttons">
            <button 
              onClick={handleOpenInGenerator}
              className="primary-button"
            >
              Open in Generator →
            </button>
            <button 
              onClick={handleDownloadContext}
              className="secondary-button"
            >
              Download Context
            </button>
            {contextId && (
              <span className="save-indicator">
                ✓ Auto-saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
