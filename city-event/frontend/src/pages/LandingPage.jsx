import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Star, ArrowRight } from 'lucide-react';
import { eventsAPI } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  }),
};

const LandingPage = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const response = await eventsAPI.getAll({ limit: 3, page: 1 });
        setFeaturedEvents(response.data);
      } catch (error) {
        toast.error('Failed to load featured events.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, [toast]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      <Helmet>
        <title>City Event — Discover and Host Events in Your City</title>
        <meta name="description" content="Find the best local events, from concerts and festivals to tech meetups and art shows. Or, create and manage your own event with our powerful tools." />
      </Helmet>

      {/* --- Hero Section --- */}
      <motion.section
        className="hero-section"
        style={{ backgroundImage: 'url(/assets/bg.jfif)' }}
        variants={fadeUp}
      >
        <div
          className="hero-overlay"
          style={{ background: 'linear-gradient(to top, rgba(17, 24, 39, 1) 10%, rgba(17, 24, 39, 0.7) 50%, rgba(17, 24, 39, 0.8) 100%)' }}
        />
        <div className="hero-content container">
          <motion.h1 className="hero-title" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.7)' }} variants={fadeUp}>
            Experience Your City
          </motion.h1>
          <motion.p className="hero-subtitle" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.7)' }} variants={fadeUp}>
            Discover concerts, festivals, meetups, and more.
          </motion.p>
          <motion.form
            className="glass"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem', maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            variants={fadeUp}
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/events?search=${searchQuery}`);
            }}
          >
            <Search color="var(--neon-cyan)" size={20} style={{ marginLeft: '0.5rem' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for events, artists, or venues"
              className="modal-input"
              style={{ flex: 1, background: 'transparent', border: 'none', marginLeft: '0.25rem', color: 'var(--pure-white)' }}
            />
            <button type="submit" className="btn-primary" style={{ flexShrink: 0, padding: '0.75rem 1.5rem' }}>
              Find Events
            </button>
          </motion.form>
        </div>
      </motion.section>

      {/* --- Featured Events Section --- */}
      <section className="section-deep">
        <motion.div className="section-header container" variants={fadeUp}>
          <h2 className="section-title">Featured Events</h2>
          <p className="section-subtitle">Handpicked events you won't want to miss.</p>
        </motion.div>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {loading
            ? <LoadingSkeleton type="card" count={3} />
            : featuredEvents.map((event, i) => (
              <motion.div key={event.id} variants={fadeUp} custom={i}>
                <Link to={`/events/${event.id}`} className="event-card">
                  <div className="event-card-image" style={{ backgroundImage: `url(${event.imageUrl})` }}>
                    <div className="event-card-badge">{event.category}</div>
                  </div>
                  <div className="event-card-body">
                    <h3 className="event-card-title">{event.title}</h3>
                    <p className="event-card-desc">Join us for an unforgettable experience.</p>
                  </div>
                  <div className="event-card-footer">
                    <div className="event-card-location">
                      <MapPin size={14} /> {event.location}
                    </div>
                    <div className="event-card-price">
                      {event.price > 0 ? `From $${event.price}` : 'Free'}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
        </div>
        <div className="container" style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/events">
            <button className="btn-secondary" style={{ padding: '0.8rem 2rem' }}>
              View All Events
              <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </button>
          </Link>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section className="section-elevated">
        <motion.div className="section-header container" variants={fadeUp}>
          <h2 className="section-title neon-text-cyan">Your Event Journey</h2>
          <p className="section-subtitle">From finding to hosting, all in one place.</p>
        </motion.div>
        <div className="container feature-grid">
          {[
            { icon: <Search />, title: 'Discover', desc: 'Find events that match your interests with powerful search and personalized recommendations.' },
            { icon: <Star />, title: 'Attend', desc: 'Get your digital tickets instantly and enjoy seamless entry with our QR code system.' },
            { icon: <Calendar />, title: 'Organize', desc: 'Create and manage your own successful events with our suite of powerful, easy-to-use tools.' }
          ].map((feature, i) => (
            <motion.div key={i} className="feature-card" variants={fadeUp} custom={i}>
              <div className="feature-icon neon-text-cyan">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default LandingPage;
