import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import API_BASE_URL from '../config/api';
import { getAuthToken } from '../config/supabaseClient';
import SourcesEditor from './SourcesEditor';
import './MyArticles.css';

function MyArticles({ isOpen, onClose }) {
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedArticleContent, setSelectedArticleContent] = useState('');
  const [isSourcesEditorOpen, setIsSourcesEditorOpen] = useState(false);
  const [writingStyle, setWritingStyle] = useState('');
  const [writingStyleFilename, setWritingStyleFilename] = useState('');
  const [isUploadingStyle, setIsUploadingStyle] = useState(false);

  // Helper function to get auth headers
  const getAuthHeaders = async () => {
    try {
      const token = await getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      console.error('Error getting auth token:', error);
      return {};
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchArticles();
      fetchSources();
      fetchWritingStyle();
    }
  }, [isOpen]);

  const fetchArticles = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/api/articles`, { headers });
      setArticles(response.data.articles || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
    }
  };

  const fetchSources = async () => {
    try {
      const headers = await getAuthHeaders();
      // Try sources.md first, then fall back to sources.txt
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/api/articles/sources.md`, { headers });
      } catch {
        response = await axios.get(`${API_BASE_URL}/api/articles/sources.txt`, { headers });
      }
      setSources(response.data);
    } catch (err) {
      console.error('Error fetching sources:', err);
    }
  };

  const handleViewArticle = async (filename) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/api/articles/${filename}`, { headers });
      let content = response.data;
      
      // Strip markdown code block wrapper if present
      if (content.startsWith('```markdown\n') && content.endsWith('\n```')) {
        content = content.slice(12, -4); // Remove ```markdown\n from start and \n``` from end
      } else if (content.startsWith('```markdown') && content.endsWith('```')) {
        content = content.slice(11, -3); // Remove ```markdown from start and ``` from end
      }
      
      console.log('Processed content (first 200 chars):', content.substring(0, 200)); // Debug log
      setSelectedArticle(filename);
      setSelectedArticleContent(content);
    } catch (err) {
      console.error('Error loading article:', err);
    }
  };

  const handleDownloadArticle = async (filename) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/api/articles/${filename}`, { headers });
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading article:', err);
    }
  };

  const handleDeleteArticle = async (filename) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${filename.replace('article_', '').replace(/_/g, ' ').replace(/\d{8}\.md/, '').replace('.md', '').trim()}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/api/articles/${filename}`, { headers });
      // Refresh the articles list after successful deletion
      fetchArticles();
      // Show success message (optional)
      console.log(`Article ${filename} deleted successfully`);
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Failed to delete article. Please try again.');
    }
  };

  const handleDownloadSources = () => {
    const blob = new Blob([sources], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sources.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const fetchWritingStyle = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/api/writing-style`, { headers });
      setWritingStyle(response.data || '');
    } catch (err) {
      console.error('Error fetching writing style:', err);
      setWritingStyle('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('text') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      alert('Please upload a text file (.txt or .md)');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      alert('File size must be less than 1MB');
      return;
    }

    setIsUploadingStyle(true);
    try {
      // Read the file content and send it as text
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const headers = await getAuthHeaders();
          const content = e.target.result;
          const response = await axios.put(`${API_BASE_URL}/api/writing-style`, {
            content: content
          }, { headers });
          
          setWritingStyle(content);
          setWritingStyleFilename(file.name);
          
          // Show success message with details
          if (response.data && response.data.content_length) {
            alert(`Writing style uploaded successfully!\nFile: ${file.name}\nSize: ${response.data.content_length} characters`);
          } else {
            alert(`Writing style uploaded successfully!\nFile: ${file.name}`);
          }
        } catch (err) {
          console.error('Error uploading writing style:', err);
          const errorMessage = err.response?.data?.detail || 'Failed to upload writing style. Please try again.';
          alert(errorMessage);
        } finally {
          setIsUploadingStyle(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Failed to read file. Please try again.');
        setIsUploadingStyle(false);
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error('Error processing file:', err);
      alert('Failed to process file. Please try again.');
      setIsUploadingStyle(false);
    }

    // Clear the input
    event.target.value = '';
  };

  const handleClearWritingStyle = async () => {
    if (!window.confirm('Are you sure you want to clear the writing style? This action cannot be undone.')) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/api/writing-style`, { headers });
      setWritingStyle('');
      setWritingStyleFilename('');
      alert('Writing style cleared successfully!');
    } catch (err) {
      console.error('Error clearing writing style:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to clear writing style. Please try again.';
      alert(errorMessage);
    }
  };


  const handleSourcesUpdated = () => {
    // Refresh sources when they are updated in the editor
    fetchSources();
  };

  if (!isOpen) return null;

  return (
    <div className="my-articles-overlay" onClick={onClose}>
      <div className="my-articles-modal" onClick={(e) => e.stopPropagation()}>
        <button className="my-articles-close" onClick={onClose}>×</button>
        
        <h2 className="my-articles-title">My Articles</h2>
        
        <div className="my-articles-content">
          {selectedArticle ? (
            <div className="article-viewer">
              <div className="article-viewer-header">
                <h3>{selectedArticle.replace('article_', '').replace(/_/g, ' ').replace(/\d{8}\.md/, '').replace(/\d{8}_\d{6}\.txt/, '').replace('.md', '').replace('.txt', '').trim()}</h3>
                <button className="back-btn" onClick={() => setSelectedArticle(null)}>
                  ← Back to List
                </button>
              </div>
              <div className="article-viewer-content">
                {selectedArticle && selectedArticle.endsWith('.md') ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedArticleContent}</ReactMarkdown>
                ) : (
                  <pre>{selectedArticleContent}</pre>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="articles-section">
                <div className="articles-header">
                  <h3> Generated Articles</h3>
                </div>
                {articles.length > 0 ? (
                  <div className="articles-grid">
                    {articles.map((articleFile, index) => {
                      const displayName = articleFile.filename
                        .replace('article_', '')
                        .replace(/_/g, ' ')
                        .replace(/\d{8}\.md/, '')
                        .replace(/\d{8}_\d{6}\.txt/, '')
                        .replace('.md', '')
                        .replace('.txt', '')
                        .trim();
                      const date = new Date(articleFile.modified);
                      
                      return (
                        <div key={index} className="article-card">
                          <div className="article-card-header">
                            <h4>{displayName || 'Untitled Article'}</h4>
                            <span className="article-date">
                              {date.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="article-card-actions">
                            <button 
                              className="card-btn view-btn" 
                              onClick={() => handleViewArticle(articleFile.filename)}
                              title="View article"
                            >
                              👁️ View
                            </button>
                            <button 
                              className="card-btn download-btn" 
                              onClick={() => handleDownloadArticle(articleFile.filename)}
                              title="Download article"
                            >
                              ⬇️
                            </button>
                            <button 
                              className="card-btn delete-btn" 
                              onClick={() => handleDeleteArticle(articleFile.filename)}
                              title="Delete article"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-message">No articles generated yet.</p>
                )}
              </div>

              <div className="sources-section">
                <div className="sources-header">
                  <h3> Research Sources</h3>
                  <button 
                    className="edit-sources-btn"
                    onClick={() => setIsSourcesEditorOpen(true)}
                    title="Edit research sources"
                  >
                     Edit Sources
                  </button>
                </div>
                {sources ? (
                  <div className="sources-wrapper">
                    <div className="sources-preview">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{sources}</ReactMarkdown>
                    </div>
                    <div className="sources-actions">
                      <button 
                        className="action-btn download-sources-btn"
                        onClick={handleDownloadSources}
                      >
                        ⬇️ Download Sources
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-sources">
                    <p className="empty-message">No sources available yet.</p>
                    <button 
                      className="add-sources-btn"
                      onClick={() => setIsSourcesEditorOpen(true)}
                    >
                      ➕ Add Sources
                    </button>
                  </div>
                )}
              </div>

              <div className="writing-style-section">
                <div className="writing-style-header">
                  <h3>Writing Style</h3>
                  <label className="upload-style-btn" htmlFor="style-upload">
                    Upload Style
                    <input
                      id="style-upload"
                      type="file"
                      accept=".txt,.md,text/*"
                      onChange={handleFileUpload}
                      disabled={isUploadingStyle}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                {writingStyle ? (
                  <div className="writing-style-wrapper">
                    <div className="writing-style-status">
                      <p className="style-uploaded-message">📄 {writingStyleFilename || 'writing_style.txt'}</p>
                    </div>
                    <div className="writing-style-actions">
                      <button 
                        className="action-btn clear-style-btn"
                        onClick={handleClearWritingStyle}
                      >
                        🗑️ Delete Style
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-writing-style">
                    <p className="empty-message">No writing style uploaded yet.</p>
                  </div>
                )}
                {isUploadingStyle && (
                  <div className="upload-progress">
                    <p>Uploading writing style...</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sources Editor Modal */}
      <SourcesEditor
        isOpen={isSourcesEditorOpen}
        onClose={() => setIsSourcesEditorOpen(false)}
        onSourcesUpdated={handleSourcesUpdated}
      />
    </div>
  );
}

export default MyArticles;
