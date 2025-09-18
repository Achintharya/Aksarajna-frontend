import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import API_BASE_URL from '../config/api';
import './AdminDashboard.css';

const AdminDashboard = ({ isOpen, user, onClose }) => {
  const [users, setUsers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      // Check if user has admin role
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      // Check user metadata for admin role
      const userMetadata = session.user.app_metadata || {};
      const userRole = userMetadata.role || session.user.user_metadata?.role;
      
      if (userRole !== 'admin') {
        setError('Access denied. Admin privileges required.');
        return;
      }

      // If admin, load data
      await Promise.all([fetchUsers(), fetchArticles()]);
      setLoading(false);
    } catch (err) {
      console.error('Error checking admin access:', err);
      setError('Error checking admin access');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  };

  const fetchArticles = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE_URL}/api/admin/articles`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to fetch articles');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Refresh users list
      await fetchUsers();
      alert('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const deleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE_URL}/api/admin/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      // Refresh articles list
      await fetchArticles();
      alert('Article deleted successfully');
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Failed to delete article');
    }
  };

  const viewArticle = async (article) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE_URL}/api/articles/${article.filename}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch article content');
      }

      const content = await response.text();
      
      // Create a modal or new window to display article content
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>${article.title || article.filename}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <h1>${article.title || article.filename}</h1>
            <p><strong>Author:</strong> ${article.user_email}</p>
            <p><strong>Created:</strong> ${new Date(article.created_at).toLocaleString()}</p>
            <hr>
            <pre>${content}</pre>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Error viewing article:', err);
      alert('Failed to load article content');
    }
  };

  // Filter and paginate data
  const filterData = (data, searchFields) => {
    if (!searchTerm) return data;
    return data.filter(item =>
      searchFields.some(field =>
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const paginateData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const filteredUsers = filterData(users, ['email', 'id']);
  const filteredArticles = filterData(articles, ['filename', 'title', 'user_email']);
  const paginatedUsers = paginateData(filteredUsers);
  const paginatedArticles = paginateData(filteredArticles);

  const totalPages = Math.ceil(
    (activeTab === 'users' ? filteredUsers.length : filteredArticles.length) / itemsPerPage
  );

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="admin-dashboard-overlay">
        <div className="admin-dashboard-modal">
          <div className="loading">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-overlay">
        <div className="admin-dashboard-modal">
          <button className="close-btn" onClick={onClose}>×</button>
          <div className="error-message">
            <h2>Access Denied</h2>
            <p>{error}</p>
            <button onClick={onClose} className="btn btn-primary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-overlay">
      <div className="admin-welcome-message">
        <h1>Welcome to Admin Dashboard</h1>
        <p>Manage users and articles across your platform</p>
      </div>
      <div className="admin-dashboard-modal">
        <div className="admin-header">
          <h2>Admin Dashboard</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('users');
              setCurrentPage(1);
              setSearchTerm('');
            }}
          >
            Users ({users.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('articles');
              setCurrentPage(1);
              setSearchTerm('');
            }}
          >
            Articles ({articles.length})
          </button>
        </div>

        <div className="admin-controls">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
          <button
            onClick={activeTab === 'users' ? fetchUsers : fetchArticles}
            className="btn btn-secondary"
          >
            Refresh
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'users' && (
            <div className="users-section">
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(user => (
                      <tr key={user.id}>
                        <td className="id-cell">{user.id}</td>
                        <td>{user.email}</td>
                        <td>{new Date(user.created_at).toLocaleString()}</td>
                        <td>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="btn btn-danger btn-sm"
                            disabled={user.id === user.id} // Prevent self-deletion
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'articles' && (
            <div className="articles-section">
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Filename</th>
                      <th>Author</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedArticles.map(article => (
                      <tr key={article.id}>
                        <td className="id-cell">{article.id}</td>
                        <td>{article.title || 'Untitled'}</td>
                        <td>{article.filename}</td>
                        <td>{article.user_email}</td>
                        <td>{new Date(article.created_at).toLocaleString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => viewArticle(article)}
                              className="btn btn-primary btn-sm"
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteArticle(article.id)}
                              className="btn btn-danger btn-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
