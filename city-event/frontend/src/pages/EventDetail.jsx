import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { eventsAPI, registrationsAPI, waitlistAPI, uploadAPI, icsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';
import EventReviews from '../components/EventReviews';

const CURRENCIES = [
  { code: 'usd', symbol: '$', label: 'USD ($)' },
  { code: 'eur', symbol: '€', label: 'EUR (€)' },
  { code: 'gbp', symbol: '£', label: 'GBP (£)' },
  { code: 'jpy', symbol: '¥', label: 'JPY (¥)' },
  { code: 'cad', symbol: 'C$', label: 'CAD (C$)' },
  { code: 'aud', symbol: 'A$', label: 'AUD (A$)' },
];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    eventsAPI.getById(id)
      .then(setEvent)
      .catch(err => setError(err.message || 'Failed to load event'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user && event && event.isFull) {
      waitlistAPI.status(id).then(d => setOnWaitlist(d.onWaitlist)).catch(() => {});
    }
  }, [user, event, id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('canceled')) {
      setError('Payment was canceled. You have not been registered.');
    }
    if (params.get('success')) {
      setSuccess('Payment successful! Check your tickets.');
    }
  }, [location]);

  const formatPrice = (price, currency) => {
    if (!price || price <= 0) return 'FREE';
    const c = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    return `${c.symbol}${parseFloat(price).toFixed(2)}`;
  };

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return; }
    setRegistering(true); setError(''); setSuccess('');
    try {
      if (event.price && event.price > 0) {
        const res = await registrationsAPI.checkout(id);
        window.location.href = res.url;
      } else {
        await registrationsAPI.register(id);
        setSuccess('Successfully registered! Check your tickets.');
        toast.success('Registration successful!');
        const updated = await eventsAPI.getById(id);
        setEvent(updated);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      toast.error(err.message || 'Registration failed');
    } finally { setRegistering(false); }
  };

  const handleWaitlistToggle = async () => {
    if (!user) { navigate('/login'); return; }
    setWaitlistLoading(true);
    try {
      if (onWaitlist) {
        await waitlistAPI.leave(id);
        setOnWaitlist(false);
        toast.success('Removed from waitlist');
      } else {
        await waitlistAPI.join(id);
        setOnWaitlist(true);
        toast.success('Joined waitlist! You\'ll be notified if a spot opens.');
      }
    } catch (err) {
      toast.error(err.message || 'Waitlist update failed');
    } finally { setWaitlistLoading(false); }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out "${event.title}" on City Event!`;
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
    };
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted successfully');
      navigate('/events');
    } catch (err) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const openEditModal = () => {
    setEditForm({
      title: event.title,
      description: event.description,
      location: event.location,
      dateTime: event.dateTime ? new Date(event.dateTime).toISOString().slice(0, 16) : '',
      capacity: event.capacity,
      imageUrl: event.imageUrl || '',
      category: event.category || 'Other',
      price: event.price || '',
      currency: event.currency || 'usd'
    });
    setShowEditModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAPI.upload(file);
      setEditForm({ ...editForm, imageUrl: res.url });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally { setUploading(false); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); setEditLoading(true);
    try {
      await eventsAPI.update(id, editForm);
      toast.success('Event updated successfully');
      setShowEditModal(false);
      const updated = await eventsAPI.getById(id);
      setEvent(updated);
    } catch (err) {
      toast.error(err.message || 'Failed to update event');
    } finally { setEditLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', minHeight: '80vh' }}>
        <h2>Event not found</h2>
        <Link to="/events"><button className="btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>Browse Events</button></Link>
      </div>
    );
  }

  const isOrganizer = user && (user.id === event.organizerId || user.role === 'admin');

  return (
    <div style={{ minHeight: '100vh' }}>
      <Helmet>
        <title>{event.title} — City Event</title>
        <meta name="description" content={event.description?.substring(0, 160) || 'Event details'} />
        <meta property="og:title" content={`${event.title} — City Event`} />
        <meta property="og:description" content={event.description?.substring(0, 200) || 'Event details'} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={window.location.href} />
        {event.imageUrl && <meta property="og:image" content={event.imageUrl} />}
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: event.title,
          description: event.description,
          startDate: event.dateTime,
          location: { '@type': 'Place', name: event.location },
          offers: { '@type': 'Offer', price: event.price || 0, priceCurrency: event.currency || 'USD' }
        })}</script>
      </Helmet>

      {/* Hero Image */}
      <div style={{
        height: '55vh',
        minHeight: '450px',
        background: `linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, rgba(10,10,10,1) 100%), url(${event.imageUrl}) center/cover`,
        display: 'flex',
        alignItems: 'flex-end'
      }}>
        <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem'
          }}>
            <span style={{
              background: 'rgba(0, 245, 255, 0.1)',
              color: 'var(--neon-cyan)',
              border: '1px solid var(--neon-cyan)',
              padding: '0.4rem 1.2rem',
              borderRadius: '50px',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {event.category}
            </span>
            {event.seriesId && (
              <Link to={`/events?series=${event.seriesId}`} style={{
                background: 'rgba(255, 190, 11, 0.1)',
                color: 'var(--neon-yellow)',
                border: '1px solid var(--neon-yellow)',
                padding: '0.4rem 1.2rem',
                borderRadius: '50px',
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textDecoration: 'none'
              }}>
                Part of Series
              </Link>
            )}
          </div>
          <h1 style={{
            color: 'var(--pure-white)',
            marginBottom: '1.5rem',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '800',
            lineHeight: '1.1'
          }}>
            {event.title}
          </h1>
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-lg)',
            flexWrap: 'wrap',
            fontSize: '1.1rem',
            color: 'var(--light-gray)'
          }}>
            <span>📅 {new Date(event.dateTime).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            })}</span>
            <span>⏰ {new Date(event.dateTime).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit'
            })}</span>
            <span>📍 {event.location}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: 'var(--spacing-xxl) var(--spacing-md)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 'var(--spacing-xl)'
        }}>
          {/* Left Column */}
          <div>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>About This Event</h2>
            <p style={{
              color: 'var(--light-gray)',
              fontSize: '1.1rem',
              lineHeight: '1.8',
              marginBottom: 'var(--spacing-xl)'
            }}>
              {event.description}
            </p>

            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Event Details</h3>
            <div style={{
              background: 'var(--dark-gray)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-lg)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div>
                <strong style={{ color: 'var(--neon-cyan)' }}>Date & Time</strong>
                <p style={{ color: 'var(--light-gray)', marginTop: '0.5rem' }}>
                  {new Date(event.dateTime).toLocaleString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: 'numeric', minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <strong style={{ color: 'var(--neon-cyan)' }}>Location</strong>
                <p style={{ color: 'var(--light-gray)', marginTop: '0.5rem' }}>
                  {event.location}
                </p>
              </div>
              <div>
                <strong style={{ color: 'var(--neon-cyan)' }}>Capacity</strong>
                <p style={{ color: 'var(--light-gray)', marginTop: '0.5rem' }}>
                  {event.registrationCount} / {event.capacity} registered
                </p>
                <div style={{
                  height: '8px',
                  background: 'var(--medium-gray)',
                  borderRadius: '4px',
                  marginTop: '0.5rem',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((event.registrationCount / event.capacity) * 100, 100)}%`,
                    background: event.isFull ? 'var(--neon-pink)' : 'var(--neon-cyan)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              {event.checkedInCount !== undefined && (
                <div>
                  <strong style={{ color: 'var(--neon-cyan)' }}>Checked In</strong>
                  <p style={{ color: 'var(--light-gray)', marginTop: '0.5rem' }}>
                    {event.checkedInCount} attendees
                  </p>
                </div>
              )}
            </div>

            {/* Organizer Actions */}
            {isOrganizer && (
              <div style={{ marginTop: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Organizer Actions</h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                  <button onClick={openEditModal} className="btn-secondary">
                    ✏️ Edit Event
                  </button>
                  <button onClick={handleDelete} className="btn-danger">
                    🗑️ Delete Event
                  </button>
                  <Link to="/scanner">
                    <button className="btn-primary">
                      📱 Scan Tickets
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Social Sharing */}
            <div style={{ marginTop: 'var(--spacing-xl)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Share This Event</h3>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                {[
                  { key: 'twitter', label: 'X', color: '#1da1f2' },
                  { key: 'facebook', label: 'FB', color: '#1877f2' },
                  { key: 'linkedin', label: 'IN', color: '#0a66c2' },
                  { key: 'email', label: '✉', color: 'var(--neon-cyan)' }
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleShare(s.key)}
                    style={{
                      background: s.color,
                      border: 'none',
                      borderRadius: '50%',
                      width: '44px',
                      height: '44px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, opacity 0.2s ease',
                      opacity: 0.9
                    }}
                    onMouseEnter={e => { e.target.style.transform = 'scale(1.1)'; e.target.style.opacity = '1'; }}
                    onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.opacity = '0.9'; }}
                    title={`Share on ${s.key}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Registration Card */}
          <div>
            <div style={{
              background: 'rgba(26, 26, 26, 0.6)',
              backdropFilter: 'blur(12px)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'sticky',
              top: '100px'
            }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                Registration
              </h3>

              <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{
                  fontSize: '3rem',
                  fontFamily: 'var(--font-display)',
                  color: 'var(--neon-cyan)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  {formatPrice(event.price, event.currency)}
                </div>
                <p style={{ color: 'var(--light-gray)', fontSize: '0.9rem' }}>
                  {event.isFull ? 'Event is full' : `${event.capacity - event.registrationCount} spots left`}
                </p>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(255, 0, 110, 0.1)',
                  border: '1px solid var(--neon-pink)',
                  color: 'var(--neon-pink)',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{
                  background: 'rgba(0, 245, 255, 0.1)',
                  border: '1px solid var(--neon-cyan)',
                  color: 'var(--neon-cyan)',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '0.9rem'
                }}>
                  {success}
                </div>
              )}

              {!isOrganizer && (
                <>
                  <button
                    onClick={handleRegister}
                    disabled={event.isFull || registering}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1.1rem',
                      opacity: (event.isFull || registering) ? 0.5 : 1,
                      cursor: (event.isFull || registering) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {registering ? 'Registering...' : event.isFull ? 'Sold Out' : event.price > 0 ? 'Buy Ticket' : 'Register Now'}
                  </button>

                  {event.isFull && (
                    <button
                      onClick={handleWaitlistToggle}
                      disabled={waitlistLoading}
                      className="btn-secondary"
                      style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        marginTop: 'var(--spacing-sm)',
                        opacity: waitlistLoading ? 0.5 : 1
                      }}
                    >
                      {waitlistLoading ? '...' : onWaitlist ? 'Leave Waitlist' : 'Join Waitlist'}
                    </button>
                  )}
                </>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginTop: 'var(--spacing-md)'
              }}>
                <a
                  href={icsAPI.downloadUrl(id)}
                  download
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: 'var(--medium-gray)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--light-gray)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.target.style.background = 'var(--medium-gray)'}
                >
                  📅 Add to Calendar
                </a>
              </div>

              <p style={{
                color: 'var(--light-gray)',
                fontSize: '0.85rem',
                textAlign: 'center',
                marginTop: 'var(--spacing-md)'
              }}>
                📧 You'll receive a QR code ticket after registration
              </p>
            </div>
          </div>
        </div>
        
        {/* Reviews Section - Full Width */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <EventReviews eventId={id} />
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--spacing-md)',
          backdropFilter: 'blur(10px)'
        }}
          onClick={() => setShowEditModal(false)}
        >
          <div style={{
            background: 'var(--dark-gray)',
            padding: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '700px',
            width: '100%',
            border: '2px solid var(--neon-cyan)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Edit Event</h2>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>
                  Event Title
                </label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>
                  Description
                </label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows="4" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>
                    Date & Time
                  </label>
                  <input type="datetime-local" value={editForm.dateTime} onChange={(e) => setEditForm({ ...editForm, dateTime: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>
                    Capacity
                  </label>
                  <input type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} min="1" />
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>
                  Location
                </label>
                <input type="text" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>
                    Price
                  </label>
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} min="0" step="0.01" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>
                    Currency
                  </label>
                  <select value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} style={{ width: '100%', padding: '0.875rem 1rem', background: 'var(--medium-gray)', border: '2px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--pure-white)' }}>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>
                  Category
                </label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} style={{ width: '100%', padding: '0.875rem 1rem', background: 'var(--medium-gray)', border: '2px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--pure-white)' }}>
                  {['Technology', 'Music', 'Business', 'Food', 'Sports', 'Arts', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>
                  Event Image
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ flex: 1 }} />
                  {uploading && <span style={{ color: 'var(--neon-cyan)' }}>Uploading...</span>}
                </div>
                <input type="url" value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="Or paste image URL" style={{ marginTop: '0.5rem' }} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <button type="submit" disabled={editLoading} className="btn-primary" style={{ flex: 1, padding: '1rem' }}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}