import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import LoadingSkeleton from '../components/LoadingSkeleton';

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xl) 0' }}>
      <Helmet><title>My Events — City Event</title></Helmet>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="gradient-text" style={{ margin: 0 }}>MY EVENTS</h1>
          <Link to="/create-event"><button className="btn-primary">+ Create Event</button></Link>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', color: 'var(--light-gray)' }}>
            <h3>No events yet</h3>
            <p style={{ marginBottom: 'var(--spacing-lg)' }}>Create your first event to get started</p>
            <Link to="/create-event"><button className="btn-primary">Create Event</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {events.map(event => (
              <div key={event.id} style={{
                background: 'var(--dark-gray)', padding: 'var(--spacing-lg)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--medium-gray)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '1rem'
              }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{event.title}</h3>
                    <span style={{
                      padding: '0.2rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '700',
                      background: event.status === 'approved' ? 'rgba(0,245,255,0.15)' : event.status === 'rejected' ? 'rgba(255,0,110,0.15)' : 'rgba(255,190,11,0.15)',
                      color: event.status === 'approved' ? 'var(--neon-cyan)' : event.status === 'rejected' ? 'var(--neon-pink)' : 'var(--neon-yellow)',
                      border: `1px solid ${event.status === 'approved' ? 'var(--neon-cyan)' : event.status === 'rejected' ? 'var(--neon-pink)' : 'var(--neon-yellow)'}`
                    }}>
                      {event.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--light-gray)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    📅 {new Date(event.dateTime).toLocaleDateString()} — 📍 {event.location}
                  </p>
                  <p style={{ color: 'var(--light-gray)', fontSize: '0.85rem' }}>
                    🎟️ {event.registrationCount}/{event.capacity} registered • ✓ {event.checkedInCount} checked in
                    {event.totalRevenue > 0 && ` • 💰 ${formatPrice(event.totalRevenue, 'usd')}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/events/${event.id}`}><button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>View</button></Link>
                  <Link to={`/dashboard/${event.id}`}><button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Analytics</button></Link>
                  <Link to={`/attendees/${event.id}`}><button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Attendees</button></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}