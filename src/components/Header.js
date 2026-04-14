import React, { useState, useEffect } from 'react';
import './Header.css';

function Header({ onAboutClick, onMyArticlesClick, onAdminClick, user, onLogout, isGuestMode }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user has admin role
    if (user) {
      const userMetadata = user.app_metadata || {};
      const userRole = userMetadata.role || user.user_metadata?.role;
      setIsAdmin(userRole === 'admin');
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img src="/logo.png" alt="Akṣarajña" className="logo-image" />
          <span className="logo-text">Akṣarajña</span>
        </div>
        <nav className="nav">
          <a href="/" className="nav-link active">Home</a>
          <button onClick={onMyArticlesClick} className="nav-link nav-button">My Articles</button>
          <button onClick={onAboutClick} className="nav-link nav-button">About</button>
          
          {user && (
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {isGuestMode ? '👤' : (user.email?.charAt(0).toUpperCase() || 'U')}
                </div>
                <span className="user-email">{isGuestMode ? 'Guest' : user.email}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-email-full">{isGuestMode ? 'Guest User' : user.email}</p>
                    <p className="user-id">ID: {user.id.slice(0, 8)}...</p>
                    {isGuestMode && <p className="user-role">🔌 Offline Mode</p>}
                    {!isGuestMode && isAdmin && <p className="user-role">👑 Admin</p>}
                  </div>
                  {!isGuestMode && isAdmin && (
                    <button 
                      className="admin-button"
                      onClick={() => {
                        onAdminClick();
                        setShowUserMenu(false);
                      }}
                    >
                      ⚙️ Admin Dashboard
                    </button>
                  )}
                  <button 
                    className="logout-button"
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
