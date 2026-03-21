import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './SellCarPage.css';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80',
];

const COLORS = [
  { name: 'White',  hex: '#F5F5F5' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Black',  hex: '#1A1A1A' },
  { name: 'Red',    hex: '#C0392B' },
  { name: 'Blue',   hex: '#2980B9' },
  { name: 'Grey',   hex: '#7F8C8D' },
  { name: 'Brown',  hex: '#6D4C41' },
  { name: 'Gold',   hex: '#C8973A' },
];

const STEPS = ['Photos', 'Details', 'Pricing', 'Review'];
const PRICE_CHIPS = ['₹11L', '₹12L', '₹12.5L', '₹13L', '₹14L'];

function formatINR(val) {
  if (!val) return '';
  const num = String(val).replace(/[^0-9]/g, '');
  return num.replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
}

function formatINRDisplay(val) {
  if (!val) return '—';
  const n = parseInt(val);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${formatINR(val)}`;
}

export default function SellCarPage() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Photos
  const [photos, setPhotos] = useState(SAMPLE_IMAGES.map((url, i) => ({ url, isHero: i === 0, isFile: false, file: null })));
  const [heroIndex, setHeroIndex] = useState(0);

  // Details
  const [make, setMake]               = useState('Hyundai');
  const [model, setModel]             = useState('Creta');
  const [year, setYear]               = useState('2021');
  const [variant, setVariant]         = useState('SX(O) Turbo DCT');
  const [fuel, setFuel]               = useState('Petrol');
  const [transmission, setTransmission] = useState('Automatic');
  const [km, setKm]                   = useState('28500');
  const [owners, setOwners]           = useState('1st');
  const [city, setCity]               = useState('Delhi');
  const [color, setColor]             = useState('White');
  const [condition, setCondition]     = useState('Good');

  // Pricing
  const [price, setPrice]             = useState('1250000');
  const [negotiable, setNegotiable]   = useState(true);
  const [csdPurchase, setCsdPurchase] = useState(false);
  const [showCsdTooltip, setShowCsdTooltip] = useState(false);

  // Description
  const [desc, setDesc] = useState('Well-maintained Hyundai Creta 2021 SX(O) Turbo in pristine condition. Single owner, always serviced at authorized Hyundai service center. All documents complete. Available for inspection at Delhi Cantonment.');

  // Contact
  const [showPhone, setShowPhone]         = useState(true);
  const [allowWhatsapp, setAllowWhatsapp] = useState(true);
  const [showEmail, setShowEmail]         = useState(true);

  const displayPrice = formatINR(price);
  const uploadedCount = photos.length;
  const years = [];
  for (let y = 2024; y >= 2000; y--) years.push(String(y));

  function setHero(idx) { setHeroIndex(idx); }

  function removePhoto(idx) {
    setPhotos(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (heroIndex >= next.length) setHeroIndex(Math.max(0, next.length - 1));
      return next;
    });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file || photos.length >= 5) return;
    const url = URL.createObjectURL(file);
    setPhotos(prev => [...prev, { url, isHero: false, isFile: true, file }]);
    e.target.value = '';
  }

  function applyPriceChip(chip) {
    const num = chip.replace('₹', '').replace('L', '');
    setPrice(String(Math.round(parseFloat(num) * 100000)));
  }

  function canProceed() {
    if (activeStep === 0) return photos.length > 0;
    if (activeStep === 1) return make && model && year;
    if (activeStep === 2) return price && parseInt(price) > 0;
    return true;
  }

  function nextStep() {
    if (activeStep < STEPS.length - 1 && canProceed()) setActiveStep(s => s + 1);
  }
  function prevStep() {
    if (activeStep > 0) setActiveStep(s => s - 1);
  }

  async function handlePublish() {
    if (!isAuthenticated) { navigate('/login'); return; }
    setSubmitting(true);
    setSubmitError('');

    try {
      // Upload file photos to Supabase Storage if any
      const finalPhotos = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.isFile && p.file) {
          const ext = p.file.name.split('.').pop();
          const key = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('car-photos')
            .upload(key, p.file, { contentType: p.file.type });
          if (uploadErr) throw new Error(`Photo upload failed: ${uploadErr.message}`);
          const { data: urlData } = supabase.storage.from('car-photos').getPublicUrl(key);
          finalPhotos.push({ url: urlData.publicUrl, isHero: i === heroIndex });
        } else if (p.url && !p.url.startsWith('blob:')) {
          // Only store real persistent URLs (Unsplash, https, etc) — never blob URLs
          finalPhotos.push({ url: p.url, isHero: i === heroIndex });
        }
      }

      const { error } = await supabase.from('car_listings').insert([{
        user_id:       user.id,
        make, model, year, variant, fuel, transmission,
        km_driven:     parseInt(km) || 0,
        owners, city, color, condition,
        price:         parseInt(price) || 0,
        negotiable, csd_purchase: csdPurchase,
        description:   desc,
        photos:        finalPhotos,
        hero_index:    heroIndex,
        show_phone:    showPhone,
        allow_whatsapp: allowWhatsapp,
        show_email:    showEmail,
        status:        'pending',
      }]);

      if (error) throw error;
      navigate('/my-listings');
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sell-page">
      <Navbar />

      {/* ── Progress Stepper ── */}
      <div className="sell-progress">
        <div className="sell-progress__inner container">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button
                className={`sell-progress__step ${i === activeStep ? 'active' : ''} ${i < activeStep ? 'done' : ''}`}
                onClick={() => i < activeStep && setActiveStep(i)}
                style={{ cursor: i < activeStep ? 'pointer' : 'default' }}
              >
                <div className="sell-progress__step-dot">
                  {i < activeStep
                    ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
                    : i + 1}
                </div>
                <span>{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`sell-progress__line ${i < activeStep ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="sell-page__body">

        {/* ── Hero Banner ── */}
        <section className="sell-hero">
          <div className="sell-hero__overlay" />
          <div className="sell-hero__container">
            <div className="sell-hero__content">
              <p className="sell-hero__eyebrow">
                <span className="sell-hero__eyebrow-line" />
                For India's Defence Community
              </p>
              <h1 className="sell-hero__title">
                List Your Car.<br />
                <span>Reach 5,000+</span> Defence Buyers.
              </h1>
              <p className="sell-hero__sub">Free listings · Verified buyers · CSD pricing guidance</p>
              <div className="sell-hero__stats">
                {[
                  { val: '₹0',   lbl: 'Listing Fee' },
                  { val: '24hr', lbl: 'Go-Live' },
                  { val: '5K+',  lbl: 'Members' },
                  { val: '100%', lbl: 'Verified' },
                ].map(s => (
                  <div className="sell-hero__stat" key={s.lbl}>
                    <span className="sell-hero__stat-val">{s.val}</span>
                    <span className="sell-hero__stat-lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="sell-form-area container">

          {/* ══ STEP 0 — PHOTOS ══ */}
          {activeStep === 0 && (
            <section className="sell-card" id="photos">
              <div className="sell-card__header">
                <p className="sell-card__eyebrow">Step 01 of 04</p>
                <h2 className="sell-card__title">Upload Car Photos</h2>
                <p className="sell-card__sub">High-quality photos get 3× more enquiries. Add up to 5 photos.</p>
              </div>

              <div className="photo-count-bar">
                <div className="photo-count-bar__fill" style={{ width: `${(uploadedCount / 5) * 100}%` }} />
              </div>
              <p className="photo-count-label">{uploadedCount} of 5 photos uploaded</p>

              <div className="photo-grid">
                <div className="photo-slot photo-slot--hero" onClick={() => photos.length === 0 && fileInputRef.current?.click()}>
                  {photos[heroIndex] ? (
                    <>
                      <img src={photos[heroIndex].url} alt="Hero" className="photo-slot__img" />
                      <div className="photo-slot__overlay">
                        <button className="photo-slot__del" onClick={e => { e.stopPropagation(); removePhoto(heroIndex); }}>✕</button>
                      </div>
                      <div className="photo-slot__hero-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        Hero Photo
                      </div>
                    </>
                  ) : (
                    <div className="photo-slot__empty">
                      <div className="photo-slot__icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </div>
                      <span className="photo-slot__label">Hero Photo</span>
                      <span className="photo-slot__hint">Click to upload</span>
                    </div>
                  )}
                </div>

                <div className="photo-grid__secondary">
                  {[0, 1, 2, 3].map(i => {
                    const realIdx = i < heroIndex ? i : i + 1 <= photos.length - 1 ? i + 1 : null;
                    const photo = realIdx !== null ? photos[realIdx] : null;
                    return (
                      <div key={i} className={`photo-slot photo-slot--small ${photo ? 'photo-slot--filled' : ''}`} onClick={() => !photo && fileInputRef.current?.click()}>
                        {photo ? (
                          <>
                            <img src={photo.url} alt={`Car ${i + 2}`} className="photo-slot__img" />
                            <div className="photo-slot__overlay">
                              <button className="photo-slot__set-hero" onClick={e => { e.stopPropagation(); setHero(realIdx); }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                Set Hero
                              </button>
                              <button className="photo-slot__del" onClick={e => { e.stopPropagation(); removePhoto(realIdx); }}>✕</button>
                            </div>
                          </>
                        ) : (
                          <div className="photo-slot__empty">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            <span className="photo-slot__hint">Add Photo</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

              <p className="photo-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                Hero photo appears at the top of your listing and as the cover in search results.
              </p>

              <div className="sell-step-nav">
                <span />
                <button className="sell-btn-gold" onClick={nextStep} disabled={!canProceed()}>
                  Continue to Details
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </section>
          )}

          {/* ══ STEP 1 — DETAILS ══ */}
          {activeStep === 1 && (
            <section className="sell-card" id="details">
              <div className="sell-card__header">
                <p className="sell-card__eyebrow">Step 02 of 04</p>
                <h2 className="sell-card__title">Car Details</h2>
                <p className="sell-card__sub">Accurate details help buyers find your listing faster.</p>
              </div>

              <div className="sell-form-grid">
                <div className="sell-field">
                  <label>Make</label>
                  <div className="sell-select-wrap">
                    <select value={make} onChange={e => setMake(e.target.value)}>
                      {['Maruti','Hyundai','Tata','Honda','Toyota','Mahindra','Ford','Kia','MG'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <svg className="sell-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4l4 4 4-4"/></svg>
                  </div>
                </div>

                <div className="sell-field">
                  <label>Model</label>
                  <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Creta" />
                </div>

                <div className="sell-field">
                  <label>Year</label>
                  <div className="sell-select-wrap">
                    <select value={year} onChange={e => setYear(e.target.value)}>
                      {years.map(y => <option key={y}>{y}</option>)}
                    </select>
                    <svg className="sell-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4l4 4 4-4"/></svg>
                  </div>
                </div>

                <div className="sell-field">
                  <label>Variant / Trim</label>
                  <input type="text" value={variant} onChange={e => setVariant(e.target.value)} placeholder="e.g. SX(O) Turbo DCT" />
                </div>

                <div className="sell-field sell-field--full">
                  <label>Fuel Type</label>
                  <div className="sell-pills">
                    {['Petrol','Diesel','CNG','Electric','Hybrid'].map(f => (
                      <button key={f} className={`sell-pill ${fuel === f ? 'sell-pill--active' : ''}`} onClick={() => setFuel(f)}>{f}</button>
                    ))}
                  </div>
                </div>

                <div className="sell-field sell-field--full">
                  <label>Transmission</label>
                  <div className="sell-pills">
                    {['Manual','Automatic'].map(t => (
                      <button key={t} className={`sell-pill ${transmission === t ? 'sell-pill--active' : ''}`} onClick={() => setTransmission(t)}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="sell-field">
                  <label>Kilometers Driven</label>
                  <div className="sell-input-suffix">
                    <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="e.g. 28500" />
                    <span className="sell-input-suffix__tag">km</span>
                  </div>
                </div>

                <div className="sell-field">
                  <label>Number of Owners</label>
                  <div className="sell-pills">
                    {['1st','2nd','3rd','4th+'].map(o => (
                      <button key={o} className={`sell-pill ${owners === o ? 'sell-pill--active' : ''}`} onClick={() => setOwners(o)}>{o}</button>
                    ))}
                  </div>
                </div>

                <div className="sell-field">
                  <label>RTO / Registration City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Delhi" />
                </div>

                <div className="sell-field">
                  <label>Condition</label>
                  <div className="sell-pills">
                    {['Excellent','Good','Fair'].map(c => (
                      <button key={c} className={`sell-pill ${condition === c ? 'sell-pill--active' : ''}`} onClick={() => setCondition(c)}>{c}</button>
                    ))}
                  </div>
                </div>

                <div className="sell-field sell-field--full">
                  <label>Color</label>
                  <div className="color-picker">
                    {COLORS.map(c => (
                      <button key={c.name} className={`color-dot ${color === c.name ? 'color-dot--active' : ''}`} style={{ '--dot-color': c.hex }} onClick={() => setColor(c.name)} title={c.name}>
                        <span className="color-dot__swatch" />
                        <span className="color-dot__label">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sell-step-nav">
                <button className="sell-btn-ghost" onClick={prevStep}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Back
                </button>
                <button className="sell-btn-gold" onClick={nextStep} disabled={!canProceed()}>
                  Continue to Pricing
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </section>
          )}

          {/* ══ STEP 2 — PRICING ══ */}
          {activeStep === 2 && (
            <section className="sell-card" id="pricing">
              <div className="sell-card__header">
                <p className="sell-card__eyebrow">Step 03 of 04</p>
                <h2 className="sell-card__title">Set Your Price</h2>
                <p className="sell-card__sub">Price it right. Based on market data for similar cars.</p>
              </div>

              <div className="price-input-wrap">
                <span className="price-input-wrap__symbol">₹</span>
                <input
                  className="price-input"
                  type="text"
                  value={displayPrice}
                  onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="00,00,000"
                />
              </div>

              <div className="price-chips">
                {PRICE_CHIPS.map(chip => (
                  <button key={chip} className="price-chip" onClick={() => applyPriceChip(chip)}>{chip}</button>
                ))}
              </div>

              <div className="price-range-card">
                <div className="price-range-card__header">
                  <span>Expected range for similar cars</span>
                  <span className="price-range-card__range">₹11.8L – ₹13.5L</span>
                </div>
                <div className="price-range-track">
                  <div className="price-range-fill" />
                  <div className="price-range-thumb" style={{ left: '54%' }} />
                </div>
                <div className="price-range-labels">
                  <span>₹11.8L <span className="dim">Low</span></span>
                  <span className="dim">Your Price</span>
                  <span>₹13.5L <span className="dim">High</span></span>
                </div>
              </div>

              <div className="price-checks">
                <label className="sell-check">
                  <input type="checkbox" checked={negotiable} onChange={e => setNegotiable(e.target.checked)} />
                  <span className="sell-check__box" />
                  <span>Price is Negotiable</span>
                </label>
                <label className="sell-check" style={{ position: 'relative' }}>
                  <input type="checkbox" checked={csdPurchase} onChange={e => setCsdPurchase(e.target.checked)} />
                  <span className="sell-check__box" />
                  <span>CSD Purchase</span>
                  <button className="csd-info-btn" onMouseEnter={() => setShowCsdTooltip(true)} onMouseLeave={() => setShowCsdTooltip(false)} type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                  </button>
                  {showCsdTooltip && <div className="csd-tooltip">Was this car purchased through the Canteen Stores Department? This helps defence buyers identify CSD-eligible vehicles.</div>}
                </label>
              </div>

              {/* Description */}
              <div className="sell-card__header" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                <h3 className="sell-card__title" style={{ fontSize: '1.2rem' }}>Describe Your Car</h3>
                <p className="sell-card__sub">Tell buyers what makes your car special.</p>
              </div>
              <div className="sell-textarea-wrap">
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={5} maxLength={1000} placeholder="Describe your car — service history, modifications, reasons for selling…" />
                <span className="sell-textarea-count">{desc.length} / 1000</span>
              </div>

              {/* Contact */}
              <div className="sell-card__header" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                <h3 className="sell-card__title" style={{ fontSize: '1.2rem' }}>Contact Preferences</h3>
                <p className="sell-card__sub">Control how buyers can reach you.</p>
              </div>
              <div className="contact-toggles">
                {[
                  { label: 'Show Phone Number',      icon: '📞', state: showPhone,     set: setShowPhone },
                  { label: 'Allow WhatsApp Messages', icon: '💬', state: allowWhatsapp, set: setAllowWhatsapp },
                  { label: 'Show Email Address',      icon: '✉️', state: showEmail,     set: setShowEmail },
                ].map(({ label, icon, state, set }) => (
                  <div className="contact-toggle-row" key={label}>
                    <div className="contact-toggle-row__info">
                      <span className="contact-toggle-row__icon">{icon}</span>
                      <span>{label}</span>
                    </div>
                    <button className={`toggle-switch ${state ? 'toggle-switch--on' : ''}`} onClick={() => set(v => !v)} role="switch" aria-checked={state}>
                      <span className="toggle-switch__knob" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="contact-privacy-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Your contact details are only shown to verified defence community members.
              </p>

              <div className="sell-step-nav">
                <button className="sell-btn-ghost" onClick={prevStep}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Back
                </button>
                <button className="sell-btn-gold" onClick={nextStep} disabled={!canProceed()}>
                  Review Listing
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </section>
          )}

          {/* ══ STEP 3 — REVIEW ══ */}
          {activeStep === 3 && (
            <section className="sell-card" id="review">
              <div className="sell-card__header">
                <p className="sell-card__eyebrow">Step 04 of 04</p>
                <h2 className="sell-card__title">Review Your Listing</h2>
                <p className="sell-card__sub">Double-check everything before publishing. Your listing goes live after admin approval (within 24 hrs).</p>
              </div>

              {/* Review Card */}
              <div className="review-card">
                {/* Hero Image */}
                {photos[heroIndex] && (
                  <div className="review-hero-img">
                    <img src={photos[heroIndex].url} alt="Hero" />
                    <div className="review-photo-strip">
                      {photos.filter((_, i) => i !== heroIndex).map((p, i) => (
                        <img key={i} src={p.url} alt={`Photo ${i+2}`} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="review-body">
                  <div className="review-title-row">
                    <h3>{year} {make} {model} {variant}</h3>
                    <div className="review-price">
                      <span>{formatINRDisplay(price)}</span>
                      {negotiable && <span className="review-neg-badge">Negotiable</span>}
                    </div>
                  </div>

                  <div className="review-chips">
                    <span className="review-chip">{fuel}</span>
                    <span className="review-chip">{transmission}</span>
                    <span className="review-chip">{parseInt(km).toLocaleString('en-IN')} km</span>
                    <span className="review-chip">{owners} Owner</span>
                    <span className="review-chip">{condition}</span>
                    {csdPurchase && <span className="review-chip review-chip--csd">CSD</span>}
                  </div>

                  <div className="review-meta-grid">
                    <div className="review-meta-item"><span>City</span><strong>{city}</strong></div>
                    <div className="review-meta-item"><span>Color</span><strong>{color}</strong></div>
                    <div className="review-meta-item"><span>Photos</span><strong>{photos.length} uploaded</strong></div>
                    <div className="review-meta-item"><span>Status</span><strong className="review-pending">Pending Approval</strong></div>
                  </div>

                  {desc && <p className="review-desc">{desc}</p>}
                </div>
              </div>

              {submitError && (
                <div className="sell-error-banner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                  {submitError}
                </div>
              )}

              <div className="sell-step-nav">
                <button className="sell-btn-ghost" onClick={prevStep} disabled={submitting}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Edit Listing
                </button>
                <button className="sell-btn-gold sell-btn-gold--publish" onClick={handlePublish} disabled={submitting}>
                  {submitting ? (
                    <><span className="sell-spinner" /> Publishing…</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Publish Listing <span className="sell-btn-gold__tag">Free</span></>
                  )}
                </button>
              </div>
            </section>
          )}

          <div style={{ height: '4rem' }} />
        </div>
      </div>

      {/* ── Sticky Progress Bar ── */}
      <div className="sell-submit-bar">
        <div className="sell-submit-bar__inner container">
          <div className="sell-submit-bar__summary">
            <span className="sell-submit-bar__car">{make} {model} {year}</span>
            <span className="sell-submit-bar__dot">·</span>
            <span className="sell-submit-bar__price">{price ? formatINRDisplay(price) : '—'}</span>
            {negotiable && <span className="sell-submit-bar__neg">Negotiable</span>}
          </div>
          <div className="sell-submit-bar__step-indicator">
            Step {activeStep + 1} of {STEPS.length} — <strong>{STEPS[activeStep]}</strong>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
