import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsAPI, checkinAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><div className="spinner" /></div>;
  if (!event) return null;

  const checkedInCount = attendees.filter(a => a.checkedIn).length;

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xl) 0' }}>
      <Helmet><title>Check-In — {event.title}</title></Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link to={`/dashboard/${id}`} style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
            <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem' }}>📱 Check-In — {event.title}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--light-gray)' }}>
              {checkedInCount}/{attendees.length} checked in
            </span>
            <button onClick={() => setScanMode(!scanMode)} className={`btn-${scanMode ? 'primary' : 'secondary'}`} style={{ padding: '0.5rem 1.25rem' }}>
              {scanMode ? '📋 List' : '📷 Scanner'}
            </button>
          </div>
        </div>

        {scanMode ? (
          <div style={{ background: 'var(--dark-gray)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '2px solid var(--neon-cyan)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Scan QR Code</h3>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Scan or paste QR code data..."
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleScan(); }}
                autoFocus
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', textAlign: 'center' }}
              />
              <button onClick={handleScan} disabled={!qrInput.trim()} className="btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)', padding: '1rem' }}>
                Verify & Check In
              </button>
            </div>
            <p style={{ color: 'var(--light-gray)', fontSize: '0.85rem', marginTop: 'var(--spacing-md)' }}>
              Use a QR code scanner app or type the code manually
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--dark-gray)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--medium-gray)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--neon-cyan)' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--neon-cyan)' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--neon-cyan)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendees.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--light-gray)' }}>No attendees registered yet</td></tr>
                ) : (
                  attendees.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', color: 'var(--pure-white)' }}>{a.fullName || 'Unknown'}</td>
                      <td style={{ padding: '1rem', color: 'var(--light-gray)', fontSize: '0.9rem' }}>{a.email}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '700',
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
          </div>
        )}
      </div>
    </div>
  );
}