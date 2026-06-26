import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI } from '../utils/api';
import { useWishlist } from '../contexts/WishlistContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EventMap from '../components/EventMap';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [location, setLocation] = useState('');
  
  const { wishlist, toggleWishlist } = useWishlist();
  const categories = ['all', 'Technology', 'Music', 'Business', 'Food', 'Sports', 'Arts', 'Other'];

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [category, search, priceRange, dateRange, location]);

  useEffect(() => {
    applyFilters();
  }, [events, category, search, priceRange, dateRange, location, page]);

  const fetchEvents = () => {
    setLoading(true);
    eventsAPI.getAll()
      .then(events => {
        setEvents(events);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const applyFilters = () => {
    let filtered = events;

    if (category !== 'all') {
      filtered = filtered.filter(e => e.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchLower) ||
        e.description.toLowerCase().includes(searchLower)
      );
    }

    filtered = filtered.filter(e => {
      const price = e.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(e => new Date(e.dateTime) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter(e => new Date(e.dateTime) <= endDate);
    }

    if (location) {
      const locationLower = location.toLowerCase();
      filtered = filtered.filter(e => 
        e.location.toLowerCase().includes(locationLower)
      );
    }

    setTotalPages(Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)));
    setFilteredEvents(filtered);
  };

  const paginatedEvents = filteredEvents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const resetFilters = () => {
    setCategory('all');
    setSearch('');
    setPriceRange([0, 500]);
    setDateRange({ start: '', end: '' });
    setLocation('');
  };

  const formatPrice = (price, currency) => {
    if (!price || price <= 0) return 'FREE';
    const symbols = { usd: '$', eur: '€', gbp: '£', jpy: '¥', cad: 'C$', aud: 'A$' };
    return `${symbols[currency] || '$'}${parseFloat(price).toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ minHeight: '100vh' }}
    >
      <Helmet>
        <title>Events — City Event</title>
        <meta name="description" content={`Browse ${filteredEvents.length} amazing events happening around the world`} />
        <meta property="og:title" content="Events — City Event" />
        <meta property="og:description" content={`Discover ${filteredEvents.length} amazing experiences happening around the world`} />
      </Helmet>

      <section className="section-elevated" style={{ paddingTop: '4rem' }}>
        <div className="container">
          {/* Header */}
          <motion.div
            className="section-header"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <h1 className="section-title neon-text-cyan">All Events</h1>
            <p className="section-subtitle">
              Discover {filteredEvents.length} amazing experiences happening around the world
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{ marginBottom: '1rem' }}
          >
            <input
              type="text"
              placeholder="Search events by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm, 8px)',
                fontSize: '0.95rem'
              }}
            />
          </motion.div>

          {/* Filter Toggle + Reset */}
          <motion.div
            className="hero-actions"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{ marginBottom: '1rem' }}
          >
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
              style={{ padding: '0.75rem 2rem' }}
            >
              {showFilters ? '▼ Hide Filters' : '► Show Advanced Filters'}
            </button>
            {(search || category !== 'all' || priceRange[0] > 0 || priceRange[1] < 500 || dateRange.start || dateRange.end || location) && (
              <button onClick={resetFilters} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>
                Reset All
              </button>
            )}
          </motion.div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <motion.div
              className="events-filter-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--spacing-lg)'
              }}>
                <div>
                  <label className="neon-text-cyan" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block', fontSize: '0.9rem' }}>
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <input type="range" min="0" max="500" value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    style={{ width: '100%', accentColor: 'var(--neon-cyan)' }} />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '0.5rem', display: 'block', fontSize: '0.9rem' }}>Start Date</label>
                  <input type="date" value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '0.5rem', display: 'block', fontSize: '0.9rem' }}>End Date</label>
                  <input type="date" value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '0.5rem', display: 'block', fontSize: '0.9rem' }}>Location</label>
                  <input type="text" placeholder="City or venue..." value={location}
                    onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Map Toggle + Category Filters */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{ marginBottom: '1.5rem' }}
          >
            <div className="hero-actions" style={{ marginBottom: '1rem' }}>
              <button onClick={() => setShowMap(!showMap)}
                className={`btn-${showMap ? 'primary' : 'secondary'}`} style={{ padding: '0.75rem 2rem' }}>
                {showMap ? '📋 Show Grid' : '🗺️ Show Map'}
              </button>
            </div>

            {showMap ? (
              <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
                <EventMap events={filteredEvents} height="500px" />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    aria-pressed={category === cat}
                    aria-label={`Filter by ${cat}`}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: category === cat ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.06)',
                      color: category === cat ? 'var(--bg-deep)' : 'rgba(255,255,255,0.6)',
                      border: '1px solid',
                      borderColor: category === cat ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease'
                    }}
                  >{cat}</button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Events Grid */}
          {loading ? (
            <LoadingSkeleton type="card" count={6} />
          ) : filteredEvents.length === 0 ? (
            <motion.div
              className="section-header"
              style={{ padding: '4rem 0' }}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ffffff' }}>No events found</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>Try adjusting your search or filters</p>
              <button onClick={resetFilters} className="btn-primary">
                Reset Filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              {paginatedEvents.map(event => (
                <motion.div key={event.id} variants={staggerItem}>
                  <div className="event-card" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(event.id);
                      }}
                      aria-label={wishlist.includes(event.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        left: '0.75rem',
                        zIndex: 10,
                        background: 'rgba(10, 10, 10, 0.7)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--neon-cyan)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    >
                      {wishlist.includes(event.id) ? '❤️' : '🤍'}
                    </button>

                    <Link
                      to={`/events/${event.id}`}
                      style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                      <div
                        className="event-card-image"
                        style={{ backgroundImage: `url(${event.imageUrl})` }}
                      >
                        <span className="event-card-badge">{event.category}</span>

                        {event.isFull && (
                          <div className="event-card-soldout">
                            <span className="event-card-soldout-label">SOLD OUT</span>
                          </div>
                        )}
                      </div>

                      <div className="event-card-body">
                        <h3 className="event-card-title">{event.title}</h3>
                        <p className="event-card-desc">{event.description}</p>
                        <div className="event-card-footer">
                          <div className="event-card-location">
                            <span>📍 {event.location}</span>
                          </div>
                          <div className="event-card-meta">
                            <span className="event-card-price">
                              {formatPrice(event.price, event.currency)}
                            </span>
                            <span style={{ color: event.isFull ? 'var(--neon-pink)' : 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>
                              {event.registrationCount}/{event.capacity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {!loading && paginatedEvents.length > 0 && totalPages > 1 && (
            <motion.div
              className="hero-actions"
              style={{ marginTop: '3rem', padding: '1.5rem 0' }}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary btn-small"
                style={{
                  opacity: page <= 1 ? 0.5 : 1,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary btn-small"
                style={{
                  opacity: page >= totalPages ? 0.5 : 1,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
