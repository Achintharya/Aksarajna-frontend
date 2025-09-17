import React, { useState } from 'react';
import './Header.css';

function Header({ onAboutClick, onMyArticlesClick, user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

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
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="user-email">{user.email}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-email-full">{user.email}</p>
                    <p className="user-id">ID: {user.id.slice(0, 8)}...</p>
                  </div>
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
