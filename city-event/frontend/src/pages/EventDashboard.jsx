import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import LoadingSkeleton from '../components/LoadingSkeleton';

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><div className="spinner" /></div>;
  if (!event) return null;

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xl) 0' }}>
      <Helmet><title>{event.title} — Dashboard</title></Helmet>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link to="/my-events" style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', textDecoration: 'none' }}>← My Events</Link>
            <h1 style={{ margin: '0.5rem 0 0' }}>{event.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/events/${event.id}`}><button className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>View Event</button></Link>
            <Link to={`/attendees/${event.id}`}><button className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Attendees</button></Link>
          </div>
        </div>

        {analytics ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
              {[
                { label: 'Registrations', value: analytics.totalRegistrations, color: 'var(--neon-cyan)' },
                { label: 'Checked In', value: analytics.checkedInCount, color: 'var(--neon-yellow)' },
                { label: 'Fill Rate', value: `${analytics.fillRate}%`, color: analytics.fillRate > 80 ? 'var(--neon-pink)' : 'var(--neon-cyan)' },
                { label: 'Revenue', value: `$${analytics.totalRevenue.toFixed(2)}`, color: 'var(--neon-yellow)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--dark-gray)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${s.color}`, textAlign: 'center' }}>
                  <h3 style={{ color: 'var(--light-gray)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{s.label}</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {analytics.registrationTrend?.length > 0 && (
              <div style={{ background: 'var(--dark-gray)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Registration Trend</h3>
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
                        <span style={{ color: 'var(--light-gray)', fontSize: '0.65rem', marginTop: '0.25rem', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                          {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ background: 'var(--dark-gray)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <Link to={`/attendees/${event.id}`}><button className="btn-secondary">📋 View Attendees</button></Link>
                <Link to="/scanner"><button className="btn-primary">📱 Scan Tickets</button></Link>
                <Link to={`/events/${event.id}`}><button className="btn-secondary">✏️ Edit Event</button></Link>
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--light-gray)', textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            Analytics data available after the first registration.
          </p>
        )}
      </div>
    </div>
  );
}