import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI, registrationsAPI, waitlistAPI, uploadAPI, icsAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';
import EventReviews from '../components/EventReviews';
import { CATEGORY_IMAGES, EVENT_FALLBACK } from '../utils/imageDefaults';

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

  useEffect(() => {
    if (!showEditModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowEditModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showEditModal]);

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

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-center" style={{ minHeight: '80vh' }}>
        <h2>Event not found</h2>
        <Link to="/events"><button className="btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>Browse Events</button></Link>
      </div>
    );
  }

  const isOrganizer = user && (user.id === event.organizerId || user.role === 'admin');
  const eventBgImage = event.imageUrl || CATEGORY_IMAGES[event.category] || EVENT_FALLBACK;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ minHeight: '100vh' }}
    >
      <Helmet>
        <title>{event.title} — City Event</title>
        <meta name="description" content={event.description?.substring(0, 160) || 'Event details'} />
        <meta property="og:title" content={`${event.title} — City Event`} />
        <meta property="og:description" content={event.description?.substring(0, 200) || 'Event details'} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={eventBgImage} />
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
      <div className="event-detail-hero" style={{ backgroundImage: `url(${eventBgImage})` }}>
        <div className="event-detail-hero-overlay" />
        <motion.div
          className="container event-detail-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            {event.category && (
              <span className="glass" style={{
                padding: '0.4rem 1.2rem',
                borderRadius: '50px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--neon-cyan)',
                border: '1px solid rgba(0, 245, 255, 0.3)'
              }}>
                {event.category}
              </span>
            )}
            {event.seriesId && (
              <Link to={`/events?series=${event.seriesId}`} className="glass" style={{
                padding: '0.4rem 1.2rem',
                borderRadius: '50px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--neon-yellow)',
                border: '1px solid rgba(255, 190, 11, 0.3)',
                textDecoration: 'none'
              }}>
                Part of Series
              </Link>
            )}
          </div>
          <h1 style={{
            color: '#ffffff',
            marginBottom: '1.5rem',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1
          }}>
            {event.title}
          </h1>
          <div style={{
            display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap',
            fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)'
          }}>
            <span>📅 {new Date(event.dateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>⏰ {new Date(event.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            <span>📍 {event.location}</span>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: 'var(--spacing-xxl) var(--spacing-md)' }}>
        <div className="event-detail-grid">
          {/* Left Column */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)', color: '#ffffff' }}>About This Event</h2>
            <p style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '1.1rem',
              lineHeight: 1.8,
              marginBottom: 'var(--spacing-xl)'
            }}>
              {event.description}
            </p>

            <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--neon-cyan)' }}>Event Details</h3>
            <div className="event-detail-section">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-lg)'
              }}>
                <div>
                  <strong style={{ color: 'var(--neon-cyan)' }}>Date & Time</strong>
                  <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.5rem' }}>
                    {new Date(event.dateTime).toLocaleString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <strong style={{ color: 'var(--neon-cyan)' }}>Location</strong>
                  <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.5rem' }}>{event.location}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--neon-cyan)' }}>Capacity</strong>
                  <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.5rem' }}>
                    {event.registrationCount} / {event.capacity} registered
                  </p>
                  <div style={{
                    height: '8px', background: 'rgba(255,255,255,0.08)',
                    borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden'
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
                    <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.5rem' }}>
                      {event.checkedInCount} attendees
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Organizer Actions */}
            {isOrganizer && (
              <motion.div
                style={{ marginTop: 'var(--spacing-xl)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#ffffff' }}>Organizer Actions</h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                  <button onClick={openEditModal} className="btn-secondary">✏️ Edit Event</button>
                  <button onClick={handleDelete} className="btn-danger">🗑️ Delete Event</button>
                  <Link to="/scanner"><button className="btn-primary">📱 Scan Tickets</button></Link>
                </div>
              </motion.div>
            )}

            {/* Social Sharing */}
            <div style={{ marginTop: 'var(--spacing-xl)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#ffffff' }}>Share This Event</h3>
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
                    className="glass"
                    aria-label={`Share on ${s.label}`}
                    style={{
                      width: '44px', height: '44px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: s.color, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                      borderRadius: '50%', transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.borderColor = s.color; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    title={`Share on ${s.key}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Registration Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="event-detail-card">
              <h3 style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center', color: '#ffffff' }}>
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
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'var(--spacing-md)' }}>
                <a href={icsAPI.downloadUrl(id)} download
                  className="glass"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', cursor: 'pointer',
                    textDecoration: 'none', borderRadius: 'var(--radius-sm)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--neon-cyan)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                  📅 Add to Calendar
                </a>
              </div>

              <p style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.85rem',
                textAlign: 'center',
                marginTop: 'var(--spacing-md)'
              }}>
                📧 You'll receive a QR code ticket after registration
              </p>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div
          style={{ maxWidth: '800px', margin: '0 auto', marginTop: 'var(--spacing-xxl)' }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <EventReviews eventId={id} />
        </motion.div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 'var(--spacing-md)',
          backdropFilter: 'blur(10px)'
        }}
          onClick={() => setShowEditModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: '#1a1a1a',
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
            <h2 style={{ marginBottom: 'var(--spacing-lg)', color: '#ffffff' }}>Edit Event</h2>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Event Title</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required className="modal-input" />
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows="4" className="modal-input" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Date & Time</label>
                  <input type="datetime-local" value={editForm.dateTime} onChange={(e) => setEditForm({ ...editForm, dateTime: e.target.value })} className="modal-input" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Capacity</label>
                  <input type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} min="1" className="modal-input" />
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Location</label>
                <input type="text" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="modal-input" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Price</label>
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} min="0" step="0.01" className="modal-input" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Currency</label>
                  <select value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} className="modal-select">
                    {CURRENCIES.map(c => (<option key={c.code} value={c.code}>{c.label}</option>))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Category</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="modal-select">
                  {['Technology', 'Music', 'Business', 'Food', 'Sports', 'Arts', 'Other'].map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Event Image</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ flex: 1, color: '#fff' }} />
                  {uploading && <span style={{ color: 'var(--neon-cyan)' }}>Uploading...</span>}
                </div>
                <input type="url" value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="Or paste image URL" className="modal-input" style={{ marginTop: '0.5rem' }} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <button type="submit" disabled={editLoading} className="btn-primary" style={{ flex: 1, padding: '1rem' }}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem' }}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}