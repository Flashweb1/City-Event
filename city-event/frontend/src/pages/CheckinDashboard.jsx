import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI, checkinAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function CheckinDashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) { navigate('/'); return; }
    Promise.all([
      eventsAPI.getById(id),
      eventsAPI.getAttendees(id).catch(() => ({ attendees: [] }))
    ])
      .then(([evt, attData]) => { setEvent(evt); setAttendees(attData.attendees || []); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleScan = async () => {
    if (!qrInput.trim()) return;
    try {
      const result = await checkinAPI.scan(qrInput.trim());
      if (result.success) {
        toast.success(result.message);
        setAttendees(prev => prev.map(a =>
          a.qrCodeData === qrInput.trim() ? { ...a, checkedIn: true, checkedInAt: new Date().toISOString() } : a
        ));
      }
    } catch (err) {
      toast.error(err.message || 'Invalid ticket');
    }
    setQrInput('');
    if (inputRef.current) inputRef.current.focus();
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!event) return null;

  const checkedInCount = attendees.filter(a => a.checkedIn).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
      style={{ minHeight: '100vh' }}
    >
      <Helmet><title>Check-In — {event.title}</title></Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div>
            <Link to={`/dashboard/${id}`} style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
            <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', color: '#ffffff' }}>📱 Check-In — {event.title}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
              {checkedInCount}/{attendees.length} checked in
            </span>
            <button onClick={() => setScanMode(!scanMode)} className={`btn-${scanMode ? 'primary' : 'secondary'}`} style={{ padding: '0.5rem 1.25rem' }}>
              {scanMode ? '📋 List' : '📷 Scanner'}
            </button>
          </div>
        </motion.div>

        {scanMode ? (
          <motion.div
            className="profile-card"
            style={{ textAlign: 'center', border: '2px solid var(--neon-cyan)' }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <h3 style={{ marginBottom: '1.25rem', color: '#ffffff' }}>Scan QR Code</h3>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Scan or paste QR code data..."
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleScan(); }}
                autoFocus
                style={{
                  width: '100%', padding: '1rem', fontSize: '1.1rem', textAlign: 'center',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-sm)', color: '#ffffff'
                }}
              />
              <button onClick={handleScan} disabled={!qrInput.trim()} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                Verify & Check In
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '1rem' }}>
              Use a QR code scanner app or type the code manually
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="profile-card"
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
                </tr>
              </thead>
              <tbody>
                {attendees.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No attendees registered yet</td></tr>
                ) : (
                  attendees.map(a => (
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
