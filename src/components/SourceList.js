import React, { useState } from 'react';
import './SourceList.css';

function SourceList({ sources }) {
  const [expandedSources, setExpandedSources] = useState({});

  const toggleSource = (index) => {
    setExpandedSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getConfidenceLabel = (score) => {
    if (!score) return 'N/A';
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  const getConfidenceColor = (score) => {
    if (!score) return '#999';
    if (score >= 0.8) return '#28a745';
    if (score >= 0.5) return '#ffc107';
    return '#dc3545';
  };

  if (!sources || sources.length === 0) {
    return (
      <div className="source-list">
        <h3>Sources</h3>
        <p className="no-sources">No sources available</p>
      </div>
    );
  }

  return (
    <div className="source-list">
      <h3>Sources ({sources.length})</h3>
      <div className="sources-container">
        {sources.map((source, index) => (
          <div key={index} className="source-item">
            <div className="source-header" onClick={() => toggleSource(index)}>
              <div className="source-main">
                <h4 className="source-title">
                  {source.title || `Source ${index + 1}`}
                </h4>
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="source-url"
                  onClick={(e) => e.stopPropagation()}
                >
                  {source.url}
                </a>
              </div>
              
              <div className="source-meta">
                {source.confidence && (
                  <span 
                    className="confidence-badge"
                    style={{ backgroundColor: getConfidenceColor(source.confidence) }}
                  >
                    {getConfidenceLabel(source.confidence)}
                  </span>
                )}
                {source.fetchTime && (
                  <span className="fetch-time">
                    {formatDate(source.fetchTime)}
                  </span>
                )}
                <button className="expand-button">
                  {expandedSources[index] ? '▼' : '▶'}
                </button>
              </div>
            </div>
            
            <div className="source-snippet">
              {source.snippet || source.description || 'No snippet available'}
            </div>
            
            {expandedSources[index] && (
              <div className="source-expanded">
                {source.content ? (
                  <div className="source-full-content">
                    <h5>Full Extracted Content:</h5>
                    <pre>{source.content}</pre>
                  </div>
                ) : (
                  <p className="no-content">Full content not available</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SourceList;
