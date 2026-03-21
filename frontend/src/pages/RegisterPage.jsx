import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css'; // shared styles
import './RegisterPage.css';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { fullName, email, password, confirmPassword } = form;

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUp({ email, password, fullName });
      setSuccess('Account created! Please check your email to confirm your account, then sign in.');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthClass = ['', 'weak', 'fair', 'good', 'strong'][strength];

  return (
    <div className="auth-page">
      {/* Left visual */}
      <div className="auth-page__visual register-visual">
        <div className="auth-page__visual-overlay" />
        <div className="auth-page__visual-content">
          <Link to="/" className="auth-page__logo">
            <div className="auth-page__logo-mark">CC</div>
            <span className="auth-page__logo-text">Car<span>Chapter</span></span>
          </Link>

          <div className="auth-page__quote">
            <p className="auth-page__quote-text">
              Join <span>5,000+ defence personnel</span> who buy and sell with confidence.
            </p>
            <span className="auth-page__quote-attr">CarChapter — Built for the Armed Forces</span>
          </div>

          <div className="register-perks">
            {[
              { icon: '🆓', text: 'Free to list your vehicle' },
              { icon: '✔', text: 'Verified buyers & sellers only' },
              { icon: '🎖', text: 'Exclusive CSD pricing guidance' },
              { icon: '⚡', text: 'Listings go live within 24 hrs' },
            ].map((p) => (
              <div className="register-perk" key={p.text}>
                <span className="register-perk__icon">{p.icon}</span>
                <span className="register-perk__text">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-page__form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-wrap__header">
            <p className="auth-form-wrap__eyebrow">Get Started</p>
            <h1 className="auth-form-wrap__title">Create your account</h1>
            <p className="auth-form-wrap__sub">
              Join the most trusted car marketplace for India's defence community.
            </p>
          </div>

          {success ? (
            <div className="auth-success">
              <span className="auth-success__icon">✓</span>
              <div>
                <strong>You're in!</strong>
                <p>{success}</p>
                <Link to="/login" className="auth-success__link">Go to Sign In →</Link>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="auth-error">
                  <span>⚠</span> {error}
                </div>
              )}

              <div className="form-field">
                <label htmlFor="fullName">Full Name</label>
                <div className="form-field__input-wrap">
                  <span className="form-field__icon">👤</span>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="reg-email">Email Address</label>
                <div className="form-field__input-wrap">
                  <span className="form-field__icon">✉</span>
                  <input
                    id="reg-email"
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
                <label htmlFor="reg-password">Password</label>
                <div className="form-field__input-wrap">
                  <span className="form-field__icon">🔒</span>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="form-field__eye"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {form.password && (
                  <div className="password-strength">
                    <div className={`password-strength__bar password-strength__bar--${strengthClass}`}>
                      <div className="password-strength__fill" style={{ width: `${strength * 25}%` }} />
                    </div>
                    <span className={`password-strength__label password-strength__label--${strengthClass}`}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="form-field__input-wrap">
                  <span className="form-field__icon">🔒</span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <span className="auth-submit-btn__spinner" /> : null}
                {loading ? 'Creating account...' : 'Create Account — It\'s Free'}
              </button>

              <p className="auth-terms">
                By registering you agree to our{' '}
                <a href="#terms">Terms of Service</a> and{' '}
                <a href="#privacy">Privacy Policy</a>.
              </p>
            </form>
          )}

          <p className="auth-footer-link">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
