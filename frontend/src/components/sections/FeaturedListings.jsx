import React, { useEffect, useState } from 'react';
import { fetchCars } from '../../api/carApi';
import { useAuth } from '../../context/AuthContext';
import CarCard from '../car/CarCard';
import './FeaturedListings.css';

function FeaturedListings() {
  const { user } = useAuth();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchCars(user?.id || null)
      .then((data) => { setCars(data || []); setError(null); })
      .catch((err) => { console.error(err); setError('Unable to load listings right now.'); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="featured" id="buy">
      <div className="container">
        <div className="featured__header">
          <div className="featured__heading-group">
            <div className="eyebrow">Available Now</div>
            <h2 className="featured__heading">Featured Listings</h2>
            <p className="featured__subtitle">
              Curated, verified vehicles from trusted defence community sellers
            </p>
          </div>
          <button className="featured__view-all">View All Listings →</button>
        </div>

        <div className="featured__filter">
          <input type="text" placeholder="Brand, model, or location..." className="filter-input" />
          <select className="filter-select">
            <option>All Makes</option>
            <option>Maruti</option>
            <option>Hyundai</option>
            <option>Toyota</option>
            <option>Honda</option>
            <option>Tata</option>
            <option>Mahindra</option>
          </select>
          <select className="filter-select">
            <option>Any Budget</option>
            <option>Under ₹5L</option>
            <option>₹5L – ₹10L</option>
            <option>₹10L – ₹20L</option>
            <option>Above ₹20L</option>
          </select>
          <select className="filter-select">
            <option>Any Year</option>
            <option>2022 – 2024</option>
            <option>2019 – 2021</option>
            <option>2015 – 2018</option>
            <option>Before 2015</option>
          </select>
          <button className="filter-btn">Search</button>
        </div>

        {loading && (
          <div className="featured__loading">
            <div className="featured__spinner" />
            Loading listings...
          </div>
        )}

        {error && <p className="featured__status featured__status--error">{error}</p>}

        {!loading && !error && cars.length === 0 && (
          <p className="featured__status">No cars in stock currently. Check back soon.</p>
        )}

        <div className="featured__grid">
          {cars.map((car, i) => (
            <CarCard key={car.id} car={car} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedListings;
