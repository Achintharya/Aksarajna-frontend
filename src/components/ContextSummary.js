import React, { useState } from 'react';
import './ContextSummary.css';

function ContextSummary({ summary, contextId, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  return (
    <div className="context-summary">
      <div className="summary-header">
        <h3>Context Summary</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-toggle"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="summary-content">
          <div className="summary-text">
            {summary}
          </div>
          
          <div className="summary-meta">
            {contextId && (
              <span className="context-id">
                ID: {contextId.slice(0, 8)}...
              </span>
            )}
            {timestamp && (
              <span className="timestamp">
                Saved: {formatTimestamp(timestamp)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContextSummary;
