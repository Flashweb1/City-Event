import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { eventsAPI } from '../utils/api';
import PricingTiers from '../components/PricingTiers';
import { HERO_BG, CATEGORY_IMAGES, EVENT_FALLBACK } from '../utils/imageDefaults';

const STATS = [
  { value: '10K+', label: 'Events Hosted' },
  { value: '500K+', label: 'Tickets Sold' },
  { value: '150+', label: 'Cities Worldwide' },
  { value: '24/7', label: 'Support' },
];

const FEATURES = [
  { icon: '⚡', title: 'Instant QR Check-In', desc: 'Lightning-fast entry with our built-in QR scanner. No queues, no hassle.' },
  { icon: '🌍', title: 'Global Reach', desc: 'Connect with events and audiences worldwide. One platform, infinite possibilities.' },
  { icon: '📊', title: 'Real-Time Analytics', desc: 'Track attendance, engagement, and revenue in real-time. Data-driven events.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const statsRef = useRef(null);

  useEffect(() => {
    eventsAPI.getAll()
      .then(events => setFeaturedEvents(events.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const eventImage = (event) => event.imageUrl || CATEGORY_IMAGES[event.category] || EVENT_FALLBACK;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>City Event — Discover Events That Move You</title>
        <meta name="description" content="The global platform for unforgettable experiences. Book, explore, and experience amazing events in your city." />
        <meta property="og:title" content="City Event — Discover Events That Move You" />
        <meta property="og:description" content="The global platform for unforgettable experiences. Book, explore, and experience amazing events." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={HERO_BG} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      {/* Hero Section */}
      <section
        className="hero-section"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-overlay-gradient" />

        <div className="container hero-content">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="hero-title">
              Discover Events<br />
              <span className="neon-text-cyan">That Move You</span>
            </h1>
            <p className="hero-subtitle">
              The global platform for unforgettable experiences. Book, explore, and connect with events in your city and beyond.
            </p>
            <div className="hero-actions">
              <Link to="/events">
                <motion.button
                  className="btn-neon-primary"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Explore Events
                </motion.button>
              </Link>
              <Link to="/create-event">
                <motion.button
                  className="btn-neon-secondary"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Create Event
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-dark" ref={statsRef}>
        <div className="container">
          <motion.div
            className="stats-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {STATS.map((stat, idx) => (
              <motion.div key={idx} variants={staggerItem}>
                <div className="stat-value neon-text-cyan">{stat.value}</div>
                <p className="stat-label">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="section-elevated">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="section-title">Featured Events</h2>
            <p className="section-subtitle">Discover the most popular experiences happening now</p>
          </motion.div>

          {loading ? (
            <div className="section-header">
              <div className="spinner" />
            </div>
          ) : (
            <motion.div
              className="grid grid-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              {featuredEvents.map(event => (
                <motion.div key={event.id} variants={staggerItem}>
                  <Link to={`/events/${event.id}`} className="event-card">
                    <div
                      className="event-card-image"
                      style={{ backgroundImage: `url(${eventImage(event)})` }}
                    >
                      {event.category && (
                        <span className="event-card-badge">{event.category}</span>
                      )}
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
                          <span>📍</span>
                          <span>{event.location}</span>
                        </div>
                        <div className="event-card-meta">
                          <span className="event-card-price">
                            {event.price && event.price > 0 ? `$${parseFloat(event.price).toFixed(2)}` : 'FREE'}
                          </span>
                          <span style={{ color: event.isFull ? 'var(--neon-pink)' : 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>
                            {event.registrationCount || 0}/{event.capacity || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            className="section-header"
            style={{ marginTop: '3rem', marginBottom: 0 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link to="/events">
              <button className="btn-primary">View All Events</button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="section-dark">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="section-title">Why City Event?</h2>
            <p className="section-subtitle">Everything you need to create and attend amazing events</p>
          </motion.div>

          <motion.div
            className="feature-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {FEATURES.map((f, idx) => (
              <motion.div key={idx} className="feature-card" variants={staggerItem}>
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <PricingTiers />

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-text">
              Choose the perfect plan and join thousands of organizers and attendees creating unforgettable experiences.
            </p>
            <Link to="/login">
              <motion.button
                className="btn-neon-primary"
                style={{ fontSize: '1.1rem', padding: '1rem 3rem' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Sign Up Free
              </motion.button>
            </Link>
            <p style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>
              Free tier includes all essential features — no credit card required
            </p>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}