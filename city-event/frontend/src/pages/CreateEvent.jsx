import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI, uploadAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';
import { validateEventForm } from '../utils/validationSchemas';

const CURRENCIES = [
  { code: 'usd', symbol: '$', label: 'USD ($)' },
  { code: 'eur', symbol: '€', label: 'EUR (€)' },
  { code: 'gbp', symbol: '£', label: 'GBP (£)' },
  { code: 'jpy', symbol: '¥', label: 'JPY (¥)' },
];

const RECURRENCE_OPTIONS = [
  { value: '', label: 'One-time event' },
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Every month' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    dateTime: '',
    capacity: '',
    imageUrl: '',
    category: 'Other',
    price: '',
    currency: 'usd',
    recurrenceRule: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { success, error: showError } = useToast();

  const categories = ['Technology', 'Music', 'Business', 'Food', 'Sports', 'Arts', 'Other'];

  // Redirect if not organizer
  if (user && user.role !== 'organizer' && user.role !== 'admin') {
    return (
      <div className="page-center" style={{ minHeight: '80vh' }}>
        <h2 style={{ color: '#ffffff' }}>Access Denied</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
          Only organizers can create events.
        </p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({
        ...prev,
        [e.target.name]: null
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAPI.upload(file);
      setFormData(prev => ({ ...prev, imageUrl: res.url }));
      success('Image uploaded');
    } catch (err) {
      showError('Upload failed');
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateEventForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    setLoading(true);

    try {
      const event = await eventsAPI.create(formData);
      success('Event created successfully!');
      setTimeout(() => navigate(`/events/${event.id}`), 500);
    } catch (err) {
      showError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
      style={{ minHeight: '100vh' }}
    >
      <Helmet><title>Create Event — City Event</title></Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.h1
          className="section-title neon-text-cyan"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          CREATE NEW EVENT
        </motion.h1>

        <motion.form
          onSubmit={handleSubmit}
          className="profile-card"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600
            }}>
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Summer Music Festival"
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: validationErrors.title ? '1px solid var(--neon-pink)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: '0.95rem'
              }}
            />
            {validationErrors.title && (
              <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.title}
              </p>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600
              }}>
                Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: validationErrors.price ? '1px solid var(--neon-pink)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: '0.95rem'
                }}
              />
              {validationErrors.price && (
                <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {validationErrors.price}
                </p>
              )}
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600
              }}>
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code} style={{ background: '#1a1a1a' }}>{c.label}</option>
                ))}
              </select>
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.4)',
              gridColumn: '1 / -1',
              marginTop: '-0.5rem'
            }}>
              Leave price empty or 0 for a free event
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600
            }}>
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell attendees what this event is about..."
              rows="5"
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: validationErrors.description ? '1px solid var(--neon-pink)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-body)',
                resize: 'vertical'
              }}
            />
            {validationErrors.description && (
              <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.description}
              </p>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600
              }}>
                Date & Time *
              </label>
              <input
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: validationErrors.dateTime ? '1px solid var(--neon-pink)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  colorScheme: 'dark'
                }}
              />
              {validationErrors.dateTime && (
                <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {validationErrors.dateTime}
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600
              }}>
                Capacity *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="e.g., 100"
                min="1"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: validationErrors.capacity ? '1px solid var(--neon-pink)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: '0.95rem'
                }}
              />
              {validationErrors.capacity && (
                <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {validationErrors.capacity}
                </p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600
            }}>
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Central Park Amphitheater"
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: validationErrors.location ? '1px solid var(--neon-pink)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: '0.95rem'
              }}
            />
            {validationErrors.location && (
              <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.location}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600
            }}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat} style={{ background: '#1a1a1a' }}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600
            }}>
              Event Image
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input type="file" accept="image/*" onChange={handleImageUpload}
                style={{
                  flex: 1,
                  color: '#ffffff',
                  padding: '0.5rem 0'
                }} />
              {uploading && <span className="neon-text-cyan">Uploading...</span>}
            </div>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="Or paste image URL"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: validationErrors.imageUrl ? '1px solid var(--neon-pink)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: '0.95rem',
                marginTop: '0.5rem'
              }}
            />
            {validationErrors.imageUrl && (
              <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.imageUrl}
              </p>
            )}
          </div>

          {/* Event Series / Recurrence */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600
            }}>
              Recurrence
            </label>
            <select
              name="recurrenceRule"
              value={formData.recurrenceRule}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              {RECURRENCE_OPTIONS.map(r => (
                <option key={r.value} value={r.value} style={{ background: '#1a1a1a' }}>{r.label}</option>
              ))}
            </select>
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '0.5rem'
            }}>
              Create a recurring event series — 12 instances will be generated
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Creating Event...' : 'Create Event'}
          </button>
        </motion.form>
      </div>
    </motion.div>
  );
}
