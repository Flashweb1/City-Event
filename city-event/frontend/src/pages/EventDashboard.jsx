import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import LoadingSkeleton from '../components/LoadingSkeleton';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function EventDashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventsAPI.getById(id),
      eventsAPI.getAnalytics(id).catch(() => null)
    ])
      .then(([evt, anal]) => {
        if (user?.id !== evt.organizerId && user?.role !== 'admin') { navigate('/'); return; }
        setEvent(evt);
        setAnalytics(anal);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!event) return null;

  const statCards = analytics ? [
    { label: 'Registrations', value: analytics.totalRegistrations, color: 'var(--neon-cyan)' },
    { label: 'Checked In', value: analytics.checkedInCount, color: 'var(--neon-yellow)' },
    { label: 'Fill Rate', value: `${analytics.fillRate}%`, color: analytics.fillRate > 80 ? 'var(--neon-pink)' : 'var(--neon-cyan)' },
    { label: 'Revenue', value: `$${analytics.totalRevenue.toFixed(2)}`, color: 'var(--neon-yellow)' },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
      style={{ minHeight: '100vh' }}
    >
      <Helmet><title>{event.title} — Dashboard</title></Helmet>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <motion.div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div>
            <Link to="/my-events" style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', textDecoration: 'none' }}>← My Events</Link>
            <h1 style={{ margin: '0.5rem 0 0', color: '#ffffff' }}>{event.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/events/${event.id}`}><button className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>View Event</button></Link>
            <Link to={`/attendees/${event.id}`}><button className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Attendees</button></Link>
          </div>
        </motion.div>

        {analytics ? (
          <>
            <motion.div
              className="admin-grid"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {statCards.map(s => (
                <motion.div
                  key={s.label}
                  className="admin-card"
                  style={{ textAlign: 'center', borderLeft: `4px solid ${s.color}` }}
                  variants={staggerItem}
                >
                  <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{s.label}</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: s.color }}>{s.value}</p>
                </motion.div>
              ))}
            </motion.div>

            {analytics.registrationTrend?.length > 0 && (
              <motion.div
                className="admin-card"
                style={{ marginBottom: '2rem' }}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
              >
                <h3 style={{ marginBottom: '1rem', color: '#ffffff' }}>Registration Trend</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '200px', padding: '1rem 0' }}>
                  {analytics.registrationTrend.map((d, i) => {
                    const max = Math.max(...analytics.registrationTrend.map(x => x.count), 1);
                    const height = (d.count / max) * 180;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '100%', background: 'var(--neon-cyan)', borderRadius: '4px 4px 0 0',
                          height: `${Math.max(height, 4)}px`, minHeight: '4px',
                          transition: 'height 0.3s ease', opacity: 0.8
                        }} />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', marginTop: '0.25rem', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                          {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            <motion.div
              className="admin-card"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <h3 style={{ marginBottom: '1rem', color: '#ffffff' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to={`/attendees/${event.id}`}><button className="btn-secondary">📋 View Attendees</button></Link>
                <Link to="/scanner"><button className="btn-primary">📱 Scan Tickets</button></Link>
                <Link to={`/events/${event.id}`}><button className="btn-secondary">✏️ Edit Event</button></Link>
              </div>
            </motion.div>
          </>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '4rem' }}>
            Analytics data available after the first registration.
          </p>
        )}
      </div>
    </motion.div>
  );
}
