import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import LoadingSkeleton from '../components/LoadingSkeleton';

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><div className="spinner" /></div>;
  if (!data) return null;

  const filtered = data.attendees.filter(a =>
    !search || a.fullName?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xl) 0' }}>
      <Helmet><title>{data.event.title} — Attendees</title></Helmet>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link to={`/dashboard/${id}`} style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
            <h1 style={{ margin: '0.5rem 0 0' }}>{data.event.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--light-gray)', fontSize: '0.9rem' }}>
              {data.checkedInCount}/{data.totalAttendees} checked in
            </span>
            <Link to="/scanner"><button className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>📱 Scan</button></Link>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <input
            type="text" placeholder="Search attendees by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem' }}
          />
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: 'var(--light-gray)', textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            {data.attendees.length === 0 ? 'No attendees yet.' : 'No attendees match your search.'}
          </p>
        ) : (
          <div style={{ background: 'var(--dark-gray)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--medium-gray)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--neon-cyan)' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--neon-cyan)' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--neon-cyan)' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--neon-cyan)' }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
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
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--light-gray)', fontSize: '0.85rem' }}>
                      {new Date(a.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}