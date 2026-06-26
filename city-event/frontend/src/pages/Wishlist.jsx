import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI } from '../utils/api';
import { useWishlist } from '../contexts/WishlistContext';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function Wishlist() {
  const [wishlistEvents, setWishlistEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetchWishlistEvents();
  }, [wishlist]);

  const fetchWishlistEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await eventsAPI.getAll();
      const favorited = allEvents.filter(e => wishlist.includes(e.id));
      setWishlistEvents(favorited);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
      style={{ minHeight: '100vh' }}
    >
      <Helmet><title>My Wishlist — City Event</title></Helmet>
      <div className="container">
        <motion.div
          className="section-header"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="section-title neon-text-cyan">❤️ MY WISHLIST</h1>
          <p className="section-subtitle">
            {wishlistEvents.length} event{wishlistEvents.length !== 1 ? 's' : ''} saved
          </p>
        </motion.div>

        {loading ? (
          <div className="section-header" style={{ padding: '3rem 0' }}>
            <div className="spinner" />
          </div>
        ) : wishlistEvents.length === 0 ? (
          <motion.div
            className="section-header"
            style={{ padding: '4rem 0' }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#ffffff' }}>No saved events yet 💔</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Start adding events to your wishlist!</p>
            <Link to="/events">
              <button className="btn-primary">Browse Events</button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {wishlistEvents.map(event => (
              <motion.div key={event.id} variants={staggerItem}>
                <div className="event-card" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(event.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      zIndex: 10,
                      background: 'rgba(255, 0, 110, 0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ❤️
                  </button>

                  <Link
                    to={`/events/${event.id}`}
                    style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    <div
                      className="event-card-image"
                      style={{ backgroundImage: `url(${event.imageUrl})` }}
                    >
                      <span className="event-card-badge">{event.category}</span>

                      {event.isFull && (
                        <div className="event-card-soldout">
                          <span className="event-card-soldout-label">SOLD OUT</span>
                        </div>
                      )}
                    </div>

                    <div className="event-card-body">
                      <h3 className="event-card-title">{event.title}</h3>
                      <p className="event-card-desc">{event.description}</p>
                      <div className="event-card-footer">
                        <div className="event-card-location">
                          <span>📍 {event.location}</span>
                        </div>
                        <div className="event-card-meta">
                          <span className="event-card-price">
                            {event.price && event.price > 0 ? `$${event.price.toFixed(2)}` : 'FREE'}
                          </span>
                          <span style={{ color: event.isFull ? 'var(--neon-pink)' : 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>
                            {event.registrationCount}/{event.capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
