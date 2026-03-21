import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './MyListingsPage.css';

function formatINRDisplay(val) {
  if (!val) return '—';
  const n = parseInt(val);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  const s = String(n).replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
  return `₹${s}`;
}

const STATUS_META = {
  pending:  { label: 'Under Review', color: '#C8973A', bg: 'rgba(200,151,58,0.12)', icon: '🕐' },
  approved: { label: 'Live',          color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: '✓' },
  rejected: { label: 'Rejected',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '✕' },
};

export default function MyListingsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('car_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setListings(data || []);
      setLoading(false);
    })();
  }, [user]);

  async function handleDelete(id) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setDeleting(id);
    const { error } = await supabase.from('car_listings').delete().eq('id', id);
    if (!error) setListings(prev => prev.filter(l => l.id !== id));
    setDeleting(null);
  }

  const heroUrl = (listing) => {
    const photos = listing.photos || [];
    const hero = photos[listing.hero_index] || photos[0];
    return hero?.url || null;
  };

  return (
    <div className="my-listings-page">
      <Navbar />

      <div className="my-listings-hero">
        <div className="container">
          <p className="my-listings-eyebrow">My Account</p>
          <h1 className="my-listings-title">My Listings</h1>
          <p className="my-listings-sub">Manage all your car listings in one place.</p>
        </div>
      </div>

      <div className="container my-listings-body">

        {/* Stats Row */}
        <div className="my-listings-stats">
          {[
            { label: 'Total Listed',  val: listings.length },
            { label: 'Live',          val: listings.filter(l => l.status === 'approved').length },
            { label: 'Under Review',  val: listings.filter(l => l.status === 'pending').length },
            { label: 'Rejected',      val: listings.filter(l => l.status === 'rejected').length },
          ].map(s => (
            <div className="my-listings-stat" key={s.label}>
              <span className="my-listings-stat__val">{s.val}</span>
              <span className="my-listings-stat__lbl">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Actions row */}
        <div className="my-listings-toolbar">
          <h2 className="my-listings-section-title">All Listings</h2>
          <Link to="/sell" className="my-listings-add-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Listing
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="my-listings-loading">
            <div className="my-listings-spinner" />
            <span>Loading your listings…</span>
          </div>
        )}

        {/* Error */}
        {error && <div className="my-listings-error">{error}</div>}

        {/* Empty */}
        {!loading && !error && listings.length === 0 && (
          <div className="my-listings-empty">
            <div className="my-listings-empty__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 3v5h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <h3>No listings yet</h3>
            <p>List your first car and reach thousands of defence community buyers.</p>
            <Link to="/sell" className="my-listings-add-btn">List Your Car — It's Free</Link>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && listings.length > 0 && (
          <div className="my-listings-grid">
            {listings.map(listing => {
              const img = heroUrl(listing);
              const meta = STATUS_META[listing.status] || STATUS_META.pending;
              return (
                <div className="listing-card" key={listing.id}>
                  {/* Image */}
                  <div className="listing-card__img-wrap">
                    {img
                      ? <img src={img} alt={`${listing.make} ${listing.model}`} className="listing-card__img" />
                      : <div className="listing-card__img-placeholder">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        </div>
                    }
                    <div className="listing-card__status-badge" style={{ color: meta.color, background: meta.bg }}>
                      {meta.icon} {meta.label}
                    </div>
                    <div className="listing-card__photo-count">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      {(listing.photos || []).length}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="listing-card__body">
                    <div className="listing-card__title-row">
                      <h3 className="listing-card__title">{listing.year} {listing.make} {listing.model}</h3>
                      <span className="listing-card__price">{formatINRDisplay(listing.price)}</span>
                    </div>
                    {listing.variant && <p className="listing-card__variant">{listing.variant}</p>}

                    <div className="listing-card__chips">
                      {listing.fuel && <span>{listing.fuel}</span>}
                      {listing.transmission && <span>{listing.transmission}</span>}
                      {listing.km_driven && <span>{parseInt(listing.km_driven).toLocaleString('en-IN')} km</span>}
                      {listing.owners && <span>{listing.owners} Owner</span>}
                    </div>

                    <div className="listing-card__footer">
                      <span className="listing-card__date">
                        {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="listing-card__actions">
                        <button
                          className="listing-card__delete"
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleting === listing.id}
                          title="Delete listing"
                        >
                          {deleting === listing.id
                            ? <span className="my-listings-spinner my-listings-spinner--sm" />
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          }
                        </button>
                      </div>
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
