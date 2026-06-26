import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import LoadingSkeleton from '../components/LoadingSkeleton';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function AttendeesList() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    eventsAPI.getAttendees(id)
      .then(d => setData(d))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!data) return null;

  const filtered = data.attendees.filter(a =>
    !search || a.fullName?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
      style={{ minHeight: '100vh' }}
    >
      <Helmet><title>{data.event.title} — Attendees</title></Helmet>
      <div className="container" style={{ maxWidth: '900px' }}>
        <motion.div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div>
            <Link to={`/dashboard/${id}`} style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
            <h1 style={{ margin: '0.5rem 0 0', color: '#ffffff' }}>{data.event.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              {data.checkedInCount}/{data.totalAttendees} checked in
            </span>
            <Link to="/scanner"><button className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>📱 Scan</button></Link>
          </div>
        </motion.div>

        <motion.div
          style={{ marginBottom: '1rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <input
            type="text"
            placeholder="Search attendees by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.875rem 1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              fontSize: '0.95rem'
            }}
          />
        </motion.div>

        {filtered.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '4rem' }}>
            {data.attendees.length === 0 ? 'No attendees yet.' : 'No attendees match your search.'}
          </p>
        ) : (
          <motion.div
            className="admin-card"
            style={{ padding: 0, overflow: 'hidden' }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--neon-cyan)' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--neon-cyan)' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--neon-cyan)' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--neon-cyan)' }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '1rem', color: '#ffffff' }}>{a.fullName || 'Unknown'}</td>
                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{a.email}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700,
                        background: a.checkedIn ? 'rgba(0,245,255,0.15)' : 'rgba(255,190,11,0.15)',
                        color: a.checkedIn ? 'var(--neon-cyan)' : 'var(--neon-yellow)',
                      }}>
                        {a.checkedIn ? '✓ Checked In' : '⏳ Not Checked In'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      {new Date(a.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
