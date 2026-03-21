import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, profile, isAdmin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    setUserMenuOpen(false);
    await signOut();
    navigate('/');
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="container navbar__container">
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-mark">CC</div>
          <span className="navbar__logo-text">Car<span>Chapter</span></span>
        </Link>

        <ul className="navbar__links">
          <li><a href="#buy">Buy Cars</a></li>
          <li><a href="#sell">Sell Your Car</a></li>
          <li><a href="#csd">CSD Cars</a></li>
          <li><a href="#benefits">Defence Benefits</a></li>
          <li><a href="#how">How It Works</a></li>
        </ul>

        <div className="navbar__actions">
          <button
            className="navbar__theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀' : '🌙'}
          </button>

          {isAuthenticated ? (
            <div className="navbar__user" ref={menuRef}>
              {isAdmin && <span className="navbar__admin-badge">Admin</span>}
              <button
                className="navbar__avatar"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                {initials}
              </button>

              {userMenuOpen && (
                <div className="navbar__user-menu">
                  <div className="navbar__user-menu-header">
                    <span className="navbar__user-menu-name">{displayName}</span>
                    <span className="navbar__user-menu-email">{user?.email}</span>
                    <span className={`navbar__user-menu-role navbar__user-menu-role--${profile?.role || 'user'}`}>
                      {isAdmin ? '🎖 Admin' : '👤 Member'}
                    </span>
                  </div>
                  <div className="navbar__user-menu-divider" />
                  <button className="navbar__user-menu-item">My Listings</button>
                  <button className="navbar__user-menu-item">Profile Settings</button>
                  {isAdmin && (
                    <button className="navbar__user-menu-item navbar__user-menu-item--admin">
                      Admin Dashboard
                    </button>
                  )}
                  <div className="navbar__user-menu-divider" />
                  <button
                    className="navbar__user-menu-item navbar__user-menu-item--danger"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="navbar__btn-login">Login</Link>
              <Link to="/register" className="navbar__btn-primary">Join Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
