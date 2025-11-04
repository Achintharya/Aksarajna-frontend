import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Home from './pages/Home';
import Generator from './pages/Generator';
import MyArticles from './components/MyArticles';
import About from './components/About';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import { supabase, getCurrentUser, getAuthToken } from './config/supabaseClient';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [showMyArticles, setShowMyArticles] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (user, session) => {
    setUser(user);
    setSession(session);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="App">
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Header 
          onAboutClick={() => setShowAbout(true)} 
          onMyArticlesClick={() => setShowMyArticles(true)}
          onAdminClick={() => setShowAdminDashboard(true)}
          user={user}
          onLogout={handleLogout}
        />
        <main className="main-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generate" element={<Generator />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>© 2025 Akṣarajña. Built with ❤️ by Achintharya.</p>
        </footer>
        <About isOpen={showAbout} onClose={() => setShowAbout(false)} />
        <MyArticles isOpen={showMyArticles} onClose={() => setShowMyArticles(false)} />
        <AdminDashboard 
          isOpen={showAdminDashboard} 
          onClose={() => setShowAdminDashboard(false)}
          user={user}
        />
        <Analytics />
      </div>
    </Router>
  );
}

export default App;
