import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import LoadingSkeleton from '../components/LoadingSkeleton';

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

export default function MyEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
      navigate('/'); return;
    }
    eventsAPI.getMyEvents()
      .then(setEvents)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const formatPrice = (price, currency) => {
    if (!price || price <= 0) return 'FREE';
    const symbols = { usd: '$', eur: '€', gbp: '£', jpy: '¥' };
    return `${symbols[currency] || '$'}${parseFloat(price).toFixed(2)}`;
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
      style={{ minHeight: '100vh' }}
    >
      <Helmet><title>My Events — City Event</title></Helmet>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <motion.div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="section-title neon-text-cyan" style={{ margin: 0 }}>MY EVENTS</h1>
          <Link to="/create-event"><button className="btn-primary">+ Create Event</button></Link>
        </motion.div>

        {events.length === 0 ? (
          <motion.div
            className="section-header"
            style={{ padding: '4rem 0' }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <h3 style={{ color: '#ffffff' }}>No events yet</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>Create your first event to get started</p>
            <Link to="/create-event"><button className="btn-primary">Create Event</button></Link>
          </motion.div>
        ) : (
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {events.map(event => (
              <motion.div
                key={event.id}
                className="profile-card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
                variants={staggerItem}
              >
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>{event.title}</h3>
                    <span style={{
                      padding: '0.2rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700,
                      background: event.status === 'approved' ? 'rgba(0,245,255,0.15)' : event.status === 'rejected' ? 'rgba(255,0,110,0.15)' : 'rgba(255,190,11,0.15)',
                      color: event.status === 'approved' ? 'var(--neon-cyan)' : event.status === 'rejected' ? 'var(--neon-pink)' : 'var(--neon-yellow)',
                      border: `1px solid ${event.status === 'approved' ? 'var(--neon-cyan)' : event.status === 'rejected' ? 'var(--neon-pink)' : 'var(--neon-yellow)'}`
                    }}>
                      {event.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    📅 {new Date(event.dateTime).toLocaleDateString()} — 📍 {event.location}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    🎟️ {event.registrationCount}/{event.capacity} registered • ✓ {event.checkedInCount} checked in
                    {event.totalRevenue > 0 && ` • 💰 ${formatPrice(event.totalRevenue, 'usd')}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/events/${event.id}`}><button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>View</button></Link>
                  <Link to={`/dashboard/${event.id}`}><button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Analytics</button></Link>
                  <Link to={`/attendees/${event.id}`}><button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Attendees</button></Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
