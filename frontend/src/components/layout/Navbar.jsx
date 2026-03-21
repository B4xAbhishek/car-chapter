import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const MOBILE_QUERY = '(max-width: 900px)';

function subscribeMobile(cb) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function getMobileSnapshot() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;
}

function getMobileServerSnapshot() {
  return false;
}

const NAV_ITEMS = [
  { type: 'route', to: '/buy', label: 'Buy Cars' },
  { type: 'route', to: '/sell', label: 'Sell Your Car' },
  { type: 'anchor', href: '#csd', label: 'CSD Cars' },
  { type: 'anchor', href: '#benefits', label: 'Defence Benefits' },
  { type: 'anchor', href: '#how', label: 'How It Works' },
];

function NavLinkList({ className, onNavigate, prependHome }) {
  return (
    <ul className={className}>
      {prependHome && (
        <li key="__home">
          <Link to="/" onClick={onNavigate}>Home</Link>
        </li>
      )}
      {NAV_ITEMS.map((item) => (
        <li key={item.label}>
          {item.type === 'route' ? (
            <Link to={item.to} onClick={onNavigate}>{item.label}</Link>
          ) : (
            <a href={item.href} onClick={onNavigate}>{item.label}</a>
          )}
        </li>
      ))}
    </ul>
  );
}

function LogoMark() {
  return (
    <>
      <div className="navbar__logo-mark">CC</div>
      <span className="navbar__logo-text">Car<span>Chapter</span></span>
    </>
  );
}

function MobileMenuSheets({
  mobileMenuOpen,
  closeMobile,
  isAdmin,
  isAuthenticated,
  displayName,
  user,
  navigate,
  handleSignOut,
}) {
  return (
    <>
      <div
        className={`navbar__mobile-backdrop${mobileMenuOpen ? ' is-visible' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <div
        id="navbar-mobile-sheet"
        className={`navbar__mobile-sheet${mobileMenuOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!mobileMenuOpen}
      >
        <NavLinkList
          className="navbar__links navbar__links--mobile"
          onNavigate={closeMobile}
          prependHome
        />

        {isAdmin && (
          <div className="navbar__admin-bar navbar__admin-bar--mobile">
            <Link to="/admin/approvals" className="navbar__approvals-link navbar__approvals-link--block" onClick={closeMobile}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              Approvals
              <span className="navbar__approvals-badge">Admin</span>
            </Link>
          </div>
        )}

        {!isAuthenticated && (
          <div className="navbar__mobile-auth">
            <Link to="/login" className="navbar__btn-login navbar__btn-login--block" onClick={closeMobile}>Login</Link>
            <Link to="/register" className="navbar__btn-primary navbar__btn-primary--block" onClick={closeMobile}>Join Free</Link>
          </div>
        )}

        {isAuthenticated && (
          <div className="navbar__mobile-account">
            <p className="navbar__mobile-account-label">Signed in as</p>
            <p className="navbar__mobile-account-name">{displayName}</p>
            <p className="navbar__mobile-account-email">{user?.email}</p>
            <button
              type="button"
              className="navbar__user-menu-item navbar__mobile-account-link"
              onClick={() => { closeMobile(); navigate('/my-listings'); }}
            >
              My Listings
            </button>
            <button
              type="button"
              className="navbar__user-menu-item navbar__mobile-account-link"
              onClick={closeMobile}
            >
              Profile Settings
            </button>
            {isAdmin && (
              <button
                type="button"
                className="navbar__user-menu-item navbar__user-menu-item--admin navbar__mobile-account-link"
                onClick={closeMobile}
              >
                Admin Dashboard
              </button>
            )}
            <div className="navbar__user-menu-divider navbar__mobile-account-divider" />
            <button
              type="button"
              className="navbar__user-menu-item navbar__user-menu-item--danger navbar__mobile-account-link"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function Navbar() {
  const { isAuthenticated, user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);

  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

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

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function handleSignOut() {
    setUserMenuOpen(false);
    closeMobile();
    await signOut();
    navigate('/');
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className={`container navbar__container${isMobile ? ' navbar__container--mobile' : ''}`}>
          {isMobile ? (
            <>
              <Link to="/" className="navbar__logo" onClick={closeMobile}>
                <LogoMark />
              </Link>
              <button
                type="button"
                className="navbar__menu-toggle"
                aria-expanded={mobileMenuOpen}
                aria-controls="navbar-mobile-sheet"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                {mobileMenuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="navbar__logo" onClick={closeMobile}>
                <LogoMark />
              </Link>

              <NavLinkList
                className="navbar__links navbar__links--desktop"
                onNavigate={undefined}
              />

              {isAdmin && (
                <div className="navbar__admin-bar navbar__admin-bar--desktop">
                  <Link to="/admin/approvals" className="navbar__approvals-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    Approvals
                    <span className="navbar__approvals-badge">Admin</span>
                  </Link>
                </div>
              )}

              <div
                className={`navbar__actions ${!isAuthenticated ? 'navbar__actions--guest' : ''}`}
              >
                {isAuthenticated ? (
                  <div className="navbar__user" ref={menuRef}>
                    {isAdmin && <span className="navbar__admin-badge">Admin</span>}
                    <button
                      type="button"
                      className="navbar__avatar"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
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
                        <button type="button" className="navbar__user-menu-item" onClick={() => { setUserMenuOpen(false); navigate('/my-listings'); }}>My Listings</button>
                        <button type="button" className="navbar__user-menu-item" onClick={() => setUserMenuOpen(false)}>Profile Settings</button>
                        {isAdmin && (
                          <button type="button" className="navbar__user-menu-item navbar__user-menu-item--admin">
                            Admin Dashboard
                          </button>
                        )}
                        <div className="navbar__user-menu-divider" />
                        <button
                          type="button"
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
            </>
          )}
        </div>
      </nav>

      {/* Outside <nav> so position:fixed is not trapped by nav backdrop-filter (containing block bug) */}
      {isMobile && (
        <MobileMenuSheets
          mobileMenuOpen={mobileMenuOpen}
          closeMobile={closeMobile}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          displayName={displayName}
          user={user}
          navigate={navigate}
          handleSignOut={handleSignOut}
        />
      )}
    </>
  );
}
