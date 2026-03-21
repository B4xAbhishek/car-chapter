import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await signIn({ email: form.email, password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left visual */}
      <div className="auth-page__visual">
        <div className="auth-page__visual-overlay" />
        <div className="auth-page__visual-content">
          <Link to="/" className="auth-page__logo">
            <div className="auth-page__logo-mark">CC</div>
            <span className="auth-page__logo-text">Car<span>Chapter</span></span>
          </Link>

          <div className="auth-page__quote">
            <p className="auth-page__quote-text">
              India's most trusted marketplace <span>for those who serve.</span>
            </p>
            <span className="auth-page__quote-attr">CarChapter — Defence First</span>
          </div>

          <div className="auth-page__trust">
            <div className="auth-trust-item">
              <span className="auth-trust-item__val">5K+</span>
              <span className="auth-trust-item__lbl">Members</span>
            </div>
            <div className="auth-trust-item">
              <span className="auth-trust-item__val">₹0</span>
              <span className="auth-trust-item__lbl">Listing Fee</span>
            </div>
            <div className="auth-trust-item">
              <span className="auth-trust-item__val">100%</span>
              <span className="auth-trust-item__lbl">Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-page__form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-wrap__header">
            <p className="auth-form-wrap__eyebrow">Welcome Back</p>
            <h1 className="auth-form-wrap__title">Sign in to your account</h1>
            <p className="auth-form-wrap__sub">
              Access your listings, messages, and CSD assistance — all in one place.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="auth-error">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <div className="form-field__input-wrap">
                <span className="form-field__icon">✉</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="form-field__input-wrap">
                <span className="form-field__icon">🔒</span>
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="form-field__eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="auth-forgot">
              <button type="button">Forgot password?</button>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="auth-submit-btn__spinner" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-link">
            Don't have an account?{' '}
            <Link to="/register">Create one — it's free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
