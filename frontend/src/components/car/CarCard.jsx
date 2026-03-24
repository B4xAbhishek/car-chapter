import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './CarCard.css';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80', // Mahindra Thar
  'https://images.unsplash.com/photo-1625231334168-34cea3e30132?auto=format&fit=crop&w=800&q=80', // Toyota Fortuner
  'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&w=800&q=80', // Hyundai Creta
  'https://images.unsplash.com/photo-1606611013004-1a23f9f0a08e?auto=format&fit=crop&w=800&q=80', // Kia Seltos
];

/** Matches car_listings shape (make, photos[], price) used across Buy / Sell / Admin */
function heroImageUrl(listing) {
  const photos = listing.photos || [];
  const hero = photos[listing.hero_index] ?? photos[0];
  return hero?.url || null;
}

function CarCard({ car, index = 0 }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const make = car.make ?? car.brand;
  const model = car.model;
  const { year, km_driven } = car;
  const price = car.price ?? car.listing_price;
  const fuel = car.fuel ?? car.fuel_type;
  const location = car.city ?? car.location;

  const title = [make, model].filter(Boolean).join(' ') || 'Listing';

  const imageUrl =
    heroImageUrl(car) ||
    (Array.isArray(car.images) && car.images[0]) ||
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

  const formattedPrice =
    price && isAuthenticated
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)
      : price && !isAuthenticated
        ? '₹ •••••••'
        : '₹ On Request';

  const formattedKm = km_driven
    ? `${new Intl.NumberFormat('en-IN').format(km_driven)} km`
    : '—';

  return (
    <div className="car-card">
      <div className="car-card__image-wrapper">
        <img className="car-card__image" src={imageUrl} alt={title} loading="lazy" />
        <div className="car-card__badge">
          <span className="car-card__tag car-card__tag--verified">✓ Verified</span>
          {year && <span className="car-card__tag car-card__tag--gold">{year}</span>}
        </div>
        <button className="car-card__favorite" aria-label="Save">♡</button>
      </div>

      <div className="car-card__content">
        <div className="car-card__header">
          <h3 className="car-card__title">{title}</h3>
          <p className="car-card__price">{formattedPrice}</p>
        </div>

        <div className="car-card__details">
          <div className="detail-row">
            <span className="detail-label">Mileage</span>
            <span className="detail-value">{formattedKm}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Fuel</span>
            <span className="detail-value">{fuel || '—'}</span>
          </div>
        </div>

        {location && (
          <p className="car-card__location">📍 {location}</p>
        )}

        <div className="car-card__cta">
          <button
            type="button"
            className="car-card__btn"
            onClick={() => car?.id != null && navigate(`/buy?car=${encodeURIComponent(car.id)}`)}
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CarCard;
