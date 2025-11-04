import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { getAuthToken } from '../config/supabaseClient';
import './Generator.css';

function Generator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const contextId = searchParams.get('contextId');
  
  const [context, setContext] = useState(null);
  const [sources, setSources] = useState([]);
  const [format, setFormat] = useState('detailed');
  const [styleId, setStyleId] = useState('default');
  const [userStyles, setUserStyles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState('');
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    if (!contextId) {
      setError('No context ID provided. Please return to search.');
      setLoading(false);
      return;
    }

    fetchContext();
    fetchUserStyles();
  }, [contextId]);

  const fetchContext = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/context/${contextId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const { summary, sources: contextSources } = response.data;
      setContext(summary);
      setSources(contextSources || []);
      setEditorContent(summary); // Pre-fill editor with summary
      setLoading(false);
    } catch (err) {
      console.error('Error fetching context:', err);
      
      if (err.response?.status === 404) {
        setError('Context not found. It may have expired or been deleted.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this context.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to load context. Please try again.');
      }
      setLoading(false);
    }
  };

  const fetchUserStyles = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/writing-styles`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setUserStyles(response.data);
      }
    } catch (err) {
      console.error('Error fetching user styles:', err);
      // Not critical - just use default
    }
  };

  const handleGenerate = async () => {
    if (!contextId) return;

    setGenerating(true);
    setGeneratedArticle('');
    setError('');
    setProgress('Generating article...');

    try {
      const token = await getAuthToken();
      
      // Simulate progress updates
      const progressMessages = [
        'Analyzing context...',
        'Structuring article...',
        'Writing content...',
        'Polishing final draft...'
      ];
      
      let msgIndex = 0;
      const progressInterval = setInterval(() => {
        if (msgIndex < progressMessages.length) {
          setProgress(progressMessages[msgIndex]);
          msgIndex++;
        }
      }, 2000);

      const response = await axios.post(
        `${API_BASE_URL}/api/generate`,
        {
          context_id: contextId,
          format: format,
          style_id: styleId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      clearInterval(progressInterval);
      setGeneratedArticle(response.data.article || response.data.content || '');
      setProgress('Article generated successfully!');
      
    } catch (err) {
      console.error('Generation error:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to generate article. Please try again.');
      }
      setProgress('');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedArticle], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `article_${contextId}_${format}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    try {
      const token = await getAuthToken();
      await axios.post(
        `${API_BASE_URL}/api/articles`,
        {
          content: generatedArticle,
          context_id: contextId,
          format: format,
          title: `Article - ${new Date().toLocaleDateString()}`
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      alert('Article saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save article. Please try again.');
    }
  };

  const toggleSourceInEditor = (sourceContent) => {
    setEditorContent(prev => prev + '\n\n' + sourceContent);
  };

  if (loading) {
    return (
      <div className="generator-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading context...</p>
        </div>
      </div>
    );
  }

  if (error && !context) {
    return (
      <div className="generator-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="primary-button"
          >
            Return to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="generator-page">
      <div className="generator-header">
        <h1>Article Generator</h1>
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          ← Back to Search
        </button>
      </div>

      <div className="generator-content">
        <div className="context-section">
          <h3>Context Summary</h3>
          <div className="context-editor">
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="editor-textarea"
              placeholder="Context will appear here..."
              readOnly={generating}
            />
          </div>

          {sources.length > 0 && (
            <div className="sources-section">
              <h4>Available Sources</h4>
              <div className="source-toggles">
                {sources.map((source, index) => (
                  <div key={index} className="source-item">
                    <span className="source-title">{source.title || source.url}</span>
                    <button 
                      onClick={() => toggleSourceInEditor(source.snippet || source.content)}
                      className="toggle-button"
                      disabled={generating}
                    >
                      Add to Editor
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="generation-controls">
          <div className="control-group">
            <label htmlFor="format">Format:</label>
            <select 
              id="format"
              value={format} 
              onChange={(e) => setFormat(e.target.value)}
              disabled={generating}
            >
              <option value="detailed">Detailed Article</option>
              <option value="summary">Summary</option>
              <option value="points">Bullet Points</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="style">Writing Style:</label>
            <select 
              id="style"
              value={styleId} 
              onChange={(e) => setStyleId(e.target.value)}
              disabled={generating}
            >
              <option value="default">Default</option>
              {userStyles.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleGenerate}
            className="generate-button"
            disabled={generating || !contextId}
          >
            {generating ? 'Generating...' : 'Generate Article'}
          </button>
        </div>

        {generating && progress && (
          <div className="progress-indicator">
            <div className="spinner"></div>
            <p>{progress}</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {generatedArticle && !generating && (
          <div className="generated-article">
            <h3>Generated Article</h3>
            <div className="article-content">
              <pre>{generatedArticle}</pre>
            </div>
            
            <div className="article-actions">
              <button onClick={handleDownload} className="action-button">
                Download
              </button>
              <button onClick={handleSave} className="action-button">
                Save to My Articles
              </button>
              <button 
                onClick={handleGenerate} 
                className="action-button"
              >
                Regenerate
              </button>
              <button 
                onClick={() => navigate(`/?contextId=${contextId}`)}
                className="action-button"
              >
                View Sources
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Generator;
