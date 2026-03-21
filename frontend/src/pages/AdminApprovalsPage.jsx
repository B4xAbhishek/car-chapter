import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { fetchAllListingsForAdmin, updateListingStatus } from '../api/carApi';
import { useAuth } from '../context/AuthContext';
import './AdminApprovalsPage.css';

const TABS = [
  { key: 'pending',  label: 'Pending',  color: '#C8973A' },
  { key: 'approved', label: 'Approved', color: '#22c55e' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
  { key: null,       label: 'All',      color: null },
];

function formatINRDisplay(val) {
  if (!val) return '—';
  const n = parseInt(val);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  const s = String(n).replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
  return `₹${s}`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminApprovalsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending');
  const [listings, setListings] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [authLoading, isAdmin, navigate]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [all, pending, approved, rejected] = await Promise.all([
        fetchAllListingsForAdmin(null),
        fetchAllListingsForAdmin('pending'),
        fetchAllListingsForAdmin('approved'),
        fetchAllListingsForAdmin('rejected'),
      ]);
      setCounts({ pending: pending.length, approved: approved.length, rejected: rejected.length, all: all.length });
      const map = { pending, approved, rejected, null: all };
      setListings(map[activeTab] ?? all);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { if (isAdmin) loadListings(); }, [isAdmin, loadListings]);

  async function handleStatus(id, status) {
    setUpdating(id);
    try {
      await updateListingStatus(id, status);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      // Also update counts
      setCounts(prev => {
        const oldStatus = listings.find(l => l.id === id)?.status;
        const next = { ...prev };
        if (oldStatus) next[oldStatus] = Math.max(0, next[oldStatus] - 1);
        next[status] = (next[status] || 0) + 1;
        return next;
      });
      showToast(status === 'approved' ? 'Listing approved — now live!' : 'Listing rejected.', status);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setUpdating(null);
    }
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const heroUrl = (listing) => {
    const photos = listing.photos || [];
    const hero = photos[listing.hero_index] || photos[0];
    return hero?.url || null;
  };

  const tabListings = activeTab === null
    ? listings
    : listings.filter(l => l.status === activeTab);

  return (
    <div className="admin-page">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`}>
          {toast.type === 'approved' && '✓ '}
          {toast.type === 'rejected' && '✕ '}
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="admin-hero">
        <div className="container">
          <div className="admin-hero__inner">
            <div>
              <p className="admin-eyebrow">
                <span className="admin-eyebrow__dot" />
                Admin Panel
              </p>
              <h1 className="admin-title">Listing Approvals</h1>
              <p className="admin-sub">Review, approve or reject submitted car listings before they go live.</p>
            </div>
            <div className="admin-hero__stats">
              <div className="admin-hero-stat admin-hero-stat--pending">
                <span>{counts.pending}</span>
                <label>Awaiting Review</label>
              </div>
              <div className="admin-hero-stat admin-hero-stat--approved">
                <span>{counts.approved}</span>
                <label>Live</label>
              </div>
              <div className="admin-hero-stat admin-hero-stat--rejected">
                <span>{counts.rejected}</span>
                <label>Rejected</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container admin-body">

        {/* Tabs */}
        <div className="admin-tabs">
          {TABS.map(t => (
            <button
              key={String(t.key)}
              className={`admin-tab ${activeTab === t.key ? 'admin-tab--active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              style={activeTab === t.key && t.color ? { '--tab-color': t.color } : {}}
            >
              {t.label}
              <span className="admin-tab__count">
                {t.key === null ? counts.all : counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div className="admin-error">{error}</div>}

        {/* Loading */}
        {loading && (
          <div className="admin-loading">
            <div className="admin-spinner" />
            Loading listings…
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tabListings.length === 0 && (
          <div className="admin-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
            <h3>All clear!</h3>
            <p>No {activeTab || ''} listings to review right now.</p>
          </div>
        )}

        {/* Listings */}
        {!loading && tabListings.length > 0 && (
          <div className="admin-grid">
            {tabListings.map(listing => {
              const img = heroUrl(listing);
              const isUpdating = updating === listing.id;
              return (
                <div className={`approval-card approval-card--${listing.status}`} key={listing.id}>

                  {/* Image */}
                  <div className="approval-card__img-wrap">
                    {img
                      ? <img src={img} alt={`${listing.make} ${listing.model}`} />
                      : <div className="approval-card__no-img">
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        </div>
                    }

                    {/* Status ribbon */}
                    <div className={`approval-card__ribbon approval-card__ribbon--${listing.status}`}>
                      {listing.status === 'pending'  && '⏳ Pending'}
                      {listing.status === 'approved' && '✓ Live'}
                      {listing.status === 'rejected' && '✕ Rejected'}
                    </div>

                    {/* Photo count */}
                    {(listing.photos || []).length > 0 && (
                      <span className="approval-card__photo-count">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        {listing.photos.length}
                      </span>
                    )}

                    {/* Photo strip */}
                    {(listing.photos || []).length > 1 && (
                      <div className="approval-card__strip">
                        {listing.photos.slice(0, 4).map((p, i) => (
                          <img key={i} src={p.url} alt="" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="approval-card__body">
                    <div className="approval-card__top">
                      <div>
                        <h3 className="approval-card__title">{listing.year} {listing.make} {listing.model}</h3>
                        {listing.variant && <p className="approval-card__variant">{listing.variant}</p>}
                      </div>
                      <span className="approval-card__price">{formatINRDisplay(listing.price)}</span>
                    </div>

                    <div className="approval-card__chips">
                      {listing.fuel        && <span>{listing.fuel}</span>}
                      {listing.transmission && <span>{listing.transmission}</span>}
                      {listing.km_driven   && <span>{parseInt(listing.km_driven).toLocaleString('en-IN')} km</span>}
                      {listing.owners      && <span>{listing.owners} Owner</span>}
                      {listing.city        && <span>{listing.city}</span>}
                      {listing.condition   && <span>{listing.condition}</span>}
                      {listing.csd_purchase && <span className="approval-card__chip--csd">CSD</span>}
                    </div>

                    {listing.description && (
                      <p className="approval-card__desc">
                        {listing.description.length > 120 ? listing.description.slice(0, 120) + '…' : listing.description}
                      </p>
                    )}

                    <div className="approval-card__meta">
                      <span className="approval-card__time">Submitted {timeAgo(listing.created_at)}</span>
                      {listing.negotiable && <span className="approval-card__neg">Negotiable</span>}
                    </div>

                    {/* Actions */}
                    <div className="approval-card__actions">
                      {listing.status !== 'approved' && (
                        <button
                          className="approval-btn approval-btn--approve"
                          onClick={() => handleStatus(listing.id, 'approved')}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <span className="admin-spinner admin-spinner--sm" /> : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                          )}
                          Approve & Publish
                        </button>
                      )}
                      {listing.status !== 'rejected' && (
                        <button
                          className="approval-btn approval-btn--reject"
                          onClick={() => handleStatus(listing.id, 'rejected')}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <span className="admin-spinner admin-spinner--sm" /> : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          )}
                          Reject
                        </button>
                      )}
                      {listing.status === 'approved' && (
                        <button
                          className="approval-btn approval-btn--undo"
                          onClick={() => handleStatus(listing.id, 'pending')}
                          disabled={isUpdating}
                        >
                          Move to Pending
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
