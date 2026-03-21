import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { fetchCars } from '../api/carApi';
import { useAuth } from '../context/AuthContext';
import './BuyCarPage.css';

/* ─── Helpers ────────────────────────────────────────────── */
function formatINR(val) {
  if (!val) return '—';
  const n = Math.round(parseInt(val) * 1.30); // 30% platform commission
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${String(n).replace(/(\d)(?=(\d\d)+\d$)/g, '$1,')}`;
}

function getHeroImage(listing) {
  const photos = listing.photos || [];
  const hero = photos[listing.hero_index] ?? photos[0];
  return hero?.url || null;
}

const MAKES = ['Maruti', 'Hyundai', 'Tata', 'Honda', 'Toyota', 'Mahindra', 'Kia', 'MG'];
const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const CONDITIONS = ['Excellent', 'Good', 'Fair'];
const BUDGETS = [
  { label: 'Any Budget', max: Infinity },
  { label: 'Under ₹3L',  max: 300000 },
  { label: '₹3L – ₹5L', min: 300000, max: 500000 },
  { label: '₹5L – ₹10L',min: 500000, max: 1000000 },
  { label: '₹10L – ₹20L',min:1000000,max: 2000000 },
  { label: 'Above ₹20L', min: 2000000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
  { value: 'km_asc',    label: 'KM: Low to High' },
];

const HERO_IMG = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80';

/* ─── Skeleton Card ───────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bc-skeleton">
      <div className="bc-skeleton__img shimmer" />
      <div className="bc-skeleton__body">
        <div className="bc-skeleton__line bc-skeleton__line--short shimmer" />
        <div className="bc-skeleton__line shimmer" />
        <div className="bc-skeleton__line bc-skeleton__line--mid shimmer" />
        <div className="bc-skeleton__specs">
          {[1,2,3,4].map(i=><div key={i} className="bc-skeleton__chip shimmer"/>)}
        </div>
      </div>
    </div>
  );
}

/* ─── Car Detail Modal ────────────────────────────────────── */
function CarDetailModal({ car, onClose }) {
  const [activePhoto, setActivePhoto] = useState(car.hero_index || 0);
  const photos = car.photos || [];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const prev = () => setActivePhoto(p => (p - 1 + photos.length) % photos.length);
  const next = () => setActivePhoto(p => (p + 1) % photos.length);

  return (
    <div className="bc-modal__backdrop" onClick={onClose}>
      <button className="bc-modal__close" onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div className="bc-modal" onClick={e => e.stopPropagation()}>

        {/* Photo gallery */}
        <div className="bc-modal__gallery">
          {photos.length > 0 ? (
            <>
              <img src={photos[activePhoto]?.url} alt="" className="bc-modal__hero-img" />
              {photos.length > 1 && (
                <>
                  <button className="bc-modal__nav bc-modal__nav--prev" onClick={prev}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button className="bc-modal__nav bc-modal__nav--next" onClick={next}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                  <div className="bc-modal__thumbnails">
                    {photos.map((p, i) => (
                      <img
                        key={i}
                        src={p.url}
                        alt=""
                        className={`bc-modal__thumb ${i === activePhoto ? 'bc-modal__thumb--active' : ''}`}
                        onClick={() => setActivePhoto(i)}
                      />
                    ))}
                  </div>
                  <div className="bc-modal__photo-counter">{activePhoto + 1} / {photos.length}</div>
                </>
              )}
            </>
          ) : (
            <div className="bc-modal__no-img">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span>No photos</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bc-modal__details">
          <div className="bc-modal__header">
            <div>
              <div className="bc-modal__badges">
                <span className="bc-modal__badge-verified">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                  Verified Defence
                </span>
                {car.csd_purchase && <span className="bc-modal__badge-csd">CSD</span>}
              </div>
              <h2 className="bc-modal__title">{car.year} {car.make} {car.model}</h2>
              {car.variant && <p className="bc-modal__variant">{car.variant}</p>}
            </div>
            <div className="bc-modal__price-col">
              <span className="bc-modal__price">{formatINR(car.price)}</span>
              {car.negotiable && <span className="bc-modal__neg">Negotiable</span>}
            </div>
          </div>

          <div className="bc-modal__specs-grid">
            {[
              { icon: '⛽', label: 'Fuel', val: car.fuel },
              { icon: '⚙️', label: 'Transmission', val: car.transmission },
              { icon: '🛣️', label: 'KM Driven', val: car.km_driven ? `${parseInt(car.km_driven).toLocaleString('en-IN')} km` : '—' },
              { icon: '👤', label: 'Owners', val: car.owners ? `${car.owners} Owner` : '—' },
              { icon: '🎨', label: 'Color', val: car.color || '—' },
              { icon: '✅', label: 'Condition', val: car.condition || '—' },
              { icon: '📅', label: 'Year', val: car.year || '—' },
              { icon: '📍', label: 'Location', val: car.city || '—' },
            ].map(s => (
              <div className="bc-modal__spec" key={s.label}>
                <span className="bc-modal__spec-icon">{s.icon}</span>
                <div>
                  <span className="bc-modal__spec-label">{s.label}</span>
                  <span className="bc-modal__spec-val">{s.val}</span>
                </div>
              </div>
            ))}
          </div>

          {car.description && (
            <div className="bc-modal__desc-section">
              <h4 className="bc-modal__section-title">Description</h4>
              <p className="bc-modal__desc">{car.description}</p>
            </div>
          )}

          <div className="bc-modal__contact">
            <h4 className="bc-modal__section-title">Interested?</h4>
            <p className="bc-modal__contact-hint">This is a verified defence community listing. Contact the seller to arrange a viewing.</p>
            <div className="bc-modal__contact-actions">
              <button className="bc-modal__contact-btn bc-modal__contact-btn--primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35a2 2 0 0 1 1.98-2.18H6.6a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.92a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Contact Seller
              </button>
              <button className="bc-modal__contact-btn bc-modal__contact-btn--secondary" onClick={onClose}>
                Back to Listings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Car Card (Grid) ─────────────────────────────────────── */
function CarCardGrid({ car, onSelect }) {
  const img = getHeroImage(car);
  return (
    <article className="bc-card bc-card--grid" onClick={() => onSelect(car)} style={{cursor:'pointer'}}>
      <div className="bc-card__img-wrap">
        {img
          ? <img src={img} alt={`${car.make} ${car.model}`} className="bc-card__img" loading="lazy" />
          : <div className="bc-card__no-img">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
        }
        <div className="bc-card__badge-verified">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
          Verified
        </div>
        {car.csd_purchase && <div className="bc-card__badge-csd">CSD</div>}
        {(car.photos||[]).length > 0 && (
          <div className="bc-card__photo-count">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            {car.photos.length}
          </div>
        )}
        <div className="bc-card__hover-action">
          <span>View Details</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
      <div className="bc-card__body">
        <div className="bc-card__top">
          <div>
            <h3 className="bc-card__title">{car.year} {car.make} {car.model}</h3>
            {car.variant && <p className="bc-card__variant">{car.variant}</p>}
          </div>
          <div className="bc-card__price-col">
            <span className="bc-card__price">{formatINR(car.price)}</span>
            {car.negotiable && <span className="bc-card__neg">Negotiable</span>}
          </div>
        </div>
        <div className="bc-card__specs">
          <span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg>
            {car.fuel || '—'}
          </span>
          <span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
            {car.transmission || '—'}
          </span>
          <span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
            {car.km_driven ? `${parseInt(car.km_driven).toLocaleString('en-IN')} km` : '—'}
          </span>
          <span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {car.owners || '—'} Owner
          </span>
        </div>
        <div className="bc-card__footer">
          {car.city && (
            <span className="bc-card__location">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {car.city}
            </span>
          )}
          <span className="bc-card__condition bc-card__condition--{car.condition?.toLowerCase()}">{car.condition}</span>
        </div>
      </div>
    </article>
  );
}

/* ─── Car Card (List) ─────────────────────────────────────── */
function CarCardList({ car, onSelect }) {
  const img = getHeroImage(car);
  return (
    <article className="bc-card bc-card--list" onClick={() => onSelect(car)} style={{cursor:'pointer'}}>
      <div className="bc-card__img-wrap bc-card__img-wrap--list">
        {img
          ? <img src={img} alt={`${car.make} ${car.model}`} className="bc-card__img" loading="lazy" />
          : <div className="bc-card__no-img">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
        }
        <div className="bc-card__badge-verified">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
          Verified
        </div>
        {car.csd_purchase && <div className="bc-card__badge-csd">CSD</div>}
      </div>
      <div className="bc-card__body bc-card__body--list">
        <div className="bc-card__list-main">
          <div>
            <h3 className="bc-card__title">{car.year} {car.make} {car.model}</h3>
            {car.variant && <p className="bc-card__variant">{car.variant}</p>}
            <div className="bc-card__specs bc-card__specs--list">
              <span>{car.fuel}</span>
              <span>{car.transmission}</span>
              <span>{car.km_driven ? `${parseInt(car.km_driven).toLocaleString('en-IN')} km` : '—'}</span>
              <span>{car.owners} Owner</span>
              {car.city && <span>📍 {car.city}</span>}
            </div>
            {car.description && <p className="bc-card__desc">{car.description.slice(0, 120)}…</p>}
          </div>
          <div className="bc-card__list-right">
            <span className="bc-card__price">{formatINR(car.price)}</span>
            {car.negotiable && <span className="bc-card__neg">Negotiable</span>}
            <button className="bc-card__list-btn" onClick={e => { e.stopPropagation(); onSelect(car); }}>View Details</button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Filter Section ─────────────────────────────────────── */
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bc-filter-section ${open ? 'bc-filter-section--open' : ''}`}>
      <button className="bc-filter-section__header" onClick={() => setOpen(v => !v)}>
        <span>{title}</span>
        <svg className="bc-filter-section__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div className="bc-filter-section__body">{children}</div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function BuyCarPage() {
  const { user } = useAuth();

  /* Data */
  const [allCars, setAllCars]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  /* Search / hero filters */
  const [heroSearch, setHeroSearch]   = useState('');
  const [heroMake, setHeroMake]       = useState('');
  const [heroBudget, setHeroBudget]   = useState('');

  /* Sidebar filters */
  const [filterMakes, setFilterMakes]             = useState([]);
  const [filterFuels, setFilterFuels]             = useState([]);
  const [filterTrans, setFilterTrans]             = useState([]);
  const [filterConditions, setFilterConditions]   = useState([]);
  const [filterMinPrice, setFilterMinPrice]       = useState('');
  const [filterMaxPrice, setFilterMaxPrice]       = useState('');
  const [filterMinYear, setFilterMinYear]         = useState('');
  const [filterMaxYear, setFilterMaxYear]         = useState('');
  const [filterMaxKm, setFilterMaxKm]             = useState('');

  /* UI state */
  const [sort, setSort]         = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [page, setPage]         = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const PER_PAGE = 12;
  const listingsRef = useRef(null);

  useEffect(() => {
    fetchCars(user?.id || null)
      .then(data => { setAllCars(data); setLoading(false); })
      .catch(e   => { setError(e.message); setLoading(false); });
  }, [user]);

  /* Toggle helper */
  const toggle = (arr, setArr, val) =>
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const clearFilters = () => {
    setHeroSearch(''); setHeroMake(''); setHeroBudget('');
    setFilterMakes([]); setFilterFuels([]); setFilterTrans([]);
    setFilterConditions([]); setFilterMinPrice(''); setFilterMaxPrice('');
    setFilterMinYear(''); setFilterMaxYear(''); setFilterMaxKm('');
    setPage(1);
  };

  /* Apply filters */
  const filtered = useMemo(() => {
    let list = [...allCars];

    const q = heroSearch.trim().toLowerCase();
    if (q) list = list.filter(c =>
      `${c.make} ${c.model} ${c.variant} ${c.city}`.toLowerCase().includes(q));

    const make = heroMake || filterMakes;
    if (heroMake) list = list.filter(c => c.make === heroMake);
    else if (filterMakes.length) list = list.filter(c => filterMakes.includes(c.make));

    if (heroBudget) {
      const b = BUDGETS.find(b => b.label === heroBudget);
      if (b) list = list.filter(c => (!b.min || c.price >= b.min) && c.price <= b.max);
    } else {
      if (filterMinPrice) list = list.filter(c => c.price >= parseInt(filterMinPrice));
      if (filterMaxPrice) list = list.filter(c => c.price <= parseInt(filterMaxPrice));
    }

    if (filterFuels.length) list = list.filter(c => filterFuels.includes(c.fuel));
    if (filterTrans.length) list = list.filter(c => filterTrans.includes(c.transmission));
    if (filterConditions.length) list = list.filter(c => filterConditions.includes(c.condition));
    if (filterMinYear) list = list.filter(c => parseInt(c.year) >= parseInt(filterMinYear));
    if (filterMaxYear) list = list.filter(c => parseInt(c.year) <= parseInt(filterMaxYear));
    if (filterMaxKm)   list = list.filter(c => c.km_driven <= parseInt(filterMaxKm));

    return list;
  }, [allCars, heroSearch, heroMake, heroBudget, filterMakes, filterFuels, filterTrans, filterConditions, filterMinPrice, filterMaxPrice, filterMinYear, filterMaxYear, filterMaxKm]);

  /* Sort */
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === 'price_asc')  list.sort((a,b) => a.price - b.price);
    if (sort === 'price_desc') list.sort((a,b) => b.price - a.price);
    if (sort === 'km_asc')     list.sort((a,b) => (a.km_driven||0) - (b.km_driven||0));
    if (sort === 'newest')     list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }, [filtered, sort]);

  const paginated   = sorted.slice(0, page * PER_PAGE);
  const hasMore     = paginated.length < sorted.length;
  const activeCount = (filterMakes.length + filterFuels.length + filterTrans.length +
    filterConditions.length + (filterMinPrice||filterMaxPrice ? 1:0) +
    (filterMinYear||filterMaxYear ? 1:0) + (filterMaxKm ? 1:0));

  function handleHeroSearch(e) {
    e.preventDefault();
    setPage(1);
    listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function loadMore() { setPage(p => p + 1); }

  return (
    <div className="bc-page">
      <Navbar />

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="bc-hero">
        <div className="bc-hero__bg">
          <img src={HERO_IMG} alt="Luxury car" className="bc-hero__img" />
          <div className="bc-hero__overlay" />
          <div className="bc-hero__grain" />
        </div>
        <div className="bc-hero__content container">
          <div className="bc-hero__text">
            <p className="bc-hero__eyebrow">
              <span className="bc-hero__eyebrow-dot" />
              Defence Community Marketplace
            </p>
            <h1 className="bc-hero__title">
              Find Your<br />
              <span className="bc-hero__title-gold">Perfect Car.</span>
            </h1>
            <p className="bc-hero__sub">
              Verified listings exclusively from India's trusted defence community
            </p>
            <div className="bc-hero__stats">
              {[
                { val: '2,400+', lbl: 'Members' },
                { val: '100%',   lbl: 'Verified' },
                { val: '₹0',     lbl: 'Listing Fee' },
                { val: '24hr',   lbl: 'Go-Live' },
              ].map(s => (
                <div className="bc-hero__stat" key={s.lbl}>
                  <span className="bc-hero__stat-val">{s.val}</span>
                  <span className="bc-hero__stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <form className="bc-hero__search" onSubmit={handleHeroSearch}>
            <div className="bc-hero__search-inner">
              <div className="bc-hero__search-field bc-hero__search-field--text">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Search make, model, city…"
                  value={heroSearch}
                  onChange={e => setHeroSearch(e.target.value)}
                />
              </div>
              <div className="bc-hero__search-divider" />
              <div className="bc-hero__search-field bc-hero__search-field--select">
                <select value={heroMake} onChange={e => setHeroMake(e.target.value)}>
                  <option value="">All Makes</option>
                  {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div className="bc-hero__search-divider" />
              <div className="bc-hero__search-field bc-hero__search-field--select">
                <select value={heroBudget} onChange={e => setHeroBudget(e.target.value)}>
                  {BUDGETS.map(b => <option key={b.label} value={b.label}>{b.label}</option>)}
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <button type="submit" className="bc-hero__search-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>
        {/* Scroll indicator */}
        <div className="bc-hero__scroll">
          <div className="bc-hero__scroll-line" />
        </div>
      </section>

      {/* ══════════════════════ BODY ══════════════════════ */}
      <div className="bc-body container" ref={listingsRef}>

        {/* Mobile filter button */}
        <button
          className={`bc-mobile-filter-btn ${activeCount > 0 ? 'bc-mobile-filter-btn--active' : ''}`}
          onClick={() => setMobileFiltersOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filters {activeCount > 0 && <span className="bc-mobile-filter-btn__count">{activeCount}</span>}
        </button>

        {/* ── Sidebar ── */}
        <aside className={`bc-sidebar ${mobileFiltersOpen ? 'bc-sidebar--mobile-open' : ''}`}>
          <div className="bc-sidebar__header">
            <h3 className="bc-sidebar__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              Filters
              {activeCount > 0 && <span className="bc-sidebar__count">{activeCount}</span>}
            </h3>
            <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
              {activeCount > 0 && (
                <button className="bc-sidebar__clear" onClick={clearFilters}>Clear All</button>
              )}
              <button className="bc-sidebar__close" onClick={() => setMobileFiltersOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <FilterSection title="Brand / Make">
            <div className="bc-filter-checks">
              {MAKES.map(m => (
                <label key={m} className={`bc-filter-check ${filterMakes.includes(m)?'bc-filter-check--checked':''}`}>
                  <input type="checkbox" checked={filterMakes.includes(m)} onChange={() => { toggle(filterMakes, setFilterMakes, m); setPage(1); }} />
                  <span className="bc-filter-check__box" />
                  <span>{m}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Budget">
            <div className="bc-filter-price-inputs">
              <input type="number" placeholder="Min ₹" value={filterMinPrice}
                onChange={e => { setFilterMinPrice(e.target.value); setPage(1); }} />
              <span className="bc-filter-price-sep">–</span>
              <input type="number" placeholder="Max ₹" value={filterMaxPrice}
                onChange={e => { setFilterMaxPrice(e.target.value); setPage(1); }} />
            </div>
          </FilterSection>

          <FilterSection title="Fuel Type">
            <div className="bc-filter-pills">
              {FUELS.map(f => (
                <button key={f}
                  className={`bc-filter-pill ${filterFuels.includes(f)?'bc-filter-pill--active':''}`}
                  onClick={() => { toggle(filterFuels, setFilterFuels, f); setPage(1); }}
                >{f}</button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Transmission">
            <div className="bc-filter-pills">
              {TRANSMISSIONS.map(t => (
                <button key={t}
                  className={`bc-filter-pill ${filterTrans.includes(t)?'bc-filter-pill--active':''}`}
                  onClick={() => { toggle(filterTrans, setFilterTrans, t); setPage(1); }}
                >{t}</button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Year Range" defaultOpen={false}>
            <div className="bc-filter-price-inputs">
              <input type="number" placeholder="From" value={filterMinYear} min="2000" max="2024"
                onChange={e => { setFilterMinYear(e.target.value); setPage(1); }} />
              <span className="bc-filter-price-sep">–</span>
              <input type="number" placeholder="To" value={filterMaxYear} min="2000" max="2024"
                onChange={e => { setFilterMaxYear(e.target.value); setPage(1); }} />
            </div>
          </FilterSection>

          <FilterSection title="Max KM Driven" defaultOpen={false}>
            <div className="bc-filter-price-inputs">
              <input type="number" placeholder="e.g. 50000" value={filterMaxKm}
                onChange={e => { setFilterMaxKm(e.target.value); setPage(1); }} />
            </div>
          </FilterSection>

          <FilterSection title="Condition" defaultOpen={false}>
            <div className="bc-filter-pills">
              {CONDITIONS.map(c => (
                <button key={c}
                  className={`bc-filter-pill ${filterConditions.includes(c)?'bc-filter-pill--active':''}`}
                  onClick={() => { toggle(filterConditions, setFilterConditions, c); setPage(1); }}
                >{c}</button>
              ))}
            </div>
          </FilterSection>
        </aside>

        {/* Sidebar backdrop (mobile) */}
        {mobileFiltersOpen && <div className="bc-sidebar__backdrop" onClick={() => setMobileFiltersOpen(false)} />}

        {/* ── Listings ── */}
        <main className="bc-listings">
          {/* Sort / Count bar */}
          <div className="bc-sortbar">
            <p className="bc-sortbar__count">
              <span>{sorted.length}</span> {sorted.length === 1 ? 'car' : 'cars'} found
              {activeCount > 0 && <button className="bc-sortbar__clear-link" onClick={clearFilters}>Clear filters</button>}
            </p>
            <div className="bc-sortbar__right">
              <div className="bc-sort-select">
                <select value={sort} onChange={e => setSort(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div className="bc-view-toggle">
                <button
                  className={`bc-view-toggle__btn ${viewMode==='grid'?'bc-view-toggle__btn--active':''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/></svg>
                </button>
                <button
                  className={`bc-view-toggle__btn ${viewMode==='list'?'bc-view-toggle__btn--active':''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && <div className="bc-error">{error}</div>}

          {/* Loading skeletons */}
          {loading && (
            <div className={`bc-grid bc-grid--${viewMode}`}>
              {Array.from({length: 6}).map((_,i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sorted.length === 0 && (
            <div className="bc-empty">
              <div className="bc-empty__icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <rect x="1" y="3" width="15" height="13" rx="2"/>
                  <path d="M16 8h5l3 3v5h-8V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <h3>No listings found</h3>
              <p>Try adjusting your filters or check back soon — new cars are listed daily.</p>
              {activeCount > 0 && (
                <button className="bc-empty__btn" onClick={clearFilters}>Clear All Filters</button>
              )}
            </div>
          )}

          {/* Cards */}
          {!loading && paginated.length > 0 && (
            <>
              <div className={`bc-grid bc-grid--${viewMode}`}>
                {paginated.map(car =>
                  viewMode === 'grid'
                    ? <CarCardGrid key={car.id} car={car} onSelect={setSelectedCar} />
                    : <CarCardList key={car.id} car={car} onSelect={setSelectedCar} />
                )}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="bc-loadmore">
                  <button className="bc-loadmore__btn" onClick={loadMore}>
                    Load More Cars
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  </button>
                  <p className="bc-loadmore__hint">Showing {paginated.length} of {sorted.length}</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />

      {selectedCar && <CarDetailModal car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  );
}
