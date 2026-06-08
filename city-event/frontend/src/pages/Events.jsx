import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../utils/api';
import { useWishlist } from '../contexts/WishlistContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EventMap from '../components/EventMap';

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
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xl) 0' }}>
      <Helmet>
        <title>Events — City Event</title>
        <meta name="description" content={`Browse ${filteredEvents.length} amazing events happening around the world`} />
        <meta property="og:title" content="Events — City Event" />
        <meta property="og:description" content={`Discover ${filteredEvents.length} amazing experiences happening around the world`} />
      </Helmet>
      <div className="container">
        {/* Header */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: 'var(--spacing-xl)',
          animation: 'slideUp 0.5s ease-out'
        }}>
          <h1 style={{ color: '#0F172A', marginBottom: '0.5rem' }}>All Events</h1>
          <p style={{ color: '#64748B', fontSize: '1.1rem' }}>
            Discover {filteredEvents.length} amazing experiences happening around the world
          </p>
        </div>

        {/* Filters Section */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          {/* Search Bar */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <input
              type="text"
              placeholder="Search events by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: '100%', width: '100%', padding: '1rem' }}
            />
          </div>

          {/* Toggle Advanced Filters */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
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
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={{
              background: '#FFFFFF', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)',
              border: '1px solid #E2E8F0', marginBottom: 'var(--spacing-lg)',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-lg)', animation: 'slideUp 0.3s ease-out',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div>
                <label style={{ color: '#4F46E5', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <input type="range" min="0" max="500" value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ color: '#4F46E5', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Start Date</label>
                <input type="date" value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ color: '#4F46E5', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>End Date</label>
                <input type="date" value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ color: '#4F46E5', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Location</label>
                <input type="text" placeholder="City or venue..." value={location}
                  onChange={(e) => setLocation(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {/* Map Toggle */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
            <button onClick={() => setShowMap(!showMap)}
              className={`btn-${showMap ? 'primary' : 'secondary'}`} style={{ padding: '0.75rem 2rem' }}>
              {showMap ? '📋 Show Grid' : '🗺️ Show Map'}
            </button>
          </div>

          {/* Map View */}
          {showMap && (
            <div style={{ marginBottom: 'var(--spacing-lg)', animation: 'slideUp 0.3s ease-out' }}>
              <EventMap events={filteredEvents} height="500px" />
            </div>
          )}

          {/* Category Filter */}
          {!showMap && <div style={{
            display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', justifyContent: 'center'
          }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: category === cat ? '#4F46E5' : '#F1F5F9',
                  color: category === cat ? '#FFFFFF' : '#475569',
                  border: '1px solid',
                  borderColor: category === cat ? '#4F46E5' : '#E2E8F0',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
              >{cat}</button>
            ))}
          </div>}
        </div>

        {/* Events Grid */}
        {loading ? (
          <LoadingSkeleton type="card" count={6} />
        ) : filteredEvents.length === 0 ? (
          <div style={{ 
            textAlign: 'center',
            padding: 'var(--spacing-xxl)',
            color: '#64748B',
            animation: 'slideUp 0.5s ease-out'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)', color: '#0F172A' }}>No events found</h3>
            <p style={{ fontSize: '1rem', marginBottom: 'var(--spacing-lg)' }}>Try adjusting your search or filters</p>
            <button onClick={resetFilters} className="btn-primary">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-3">
            {paginatedEvents.map((event, idx) => (
              <div 
                key={event.id}
                style={{ animation: `slideUp 0.5s ease-out ${idx * 0.05}s backwards` }}
              >
                <div className="card" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(event.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: 'var(--spacing-sm)',
                      left: 'var(--spacing-sm)',
                      zIndex: 10,
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #E2E8F0',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#4F46E5'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.9)'}
                  >
                    {wishlist.includes(event.id) ? '❤️' : '🤍'}
                  </button>

                  <Link 
                    to={`/events/${event.id}`}
                    style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{
                      height: '220px',
                      background: `url(${event.imageUrl}) center/cover`,
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: '#4F46E5',
                        color: '#FFFFFF',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {event.category}
                      </div>

                      {event.isFull && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(15, 23, 42, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            background: '#EF4444',
                            color: '#FFFFFF',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '700'
                          }}>
                            SOLD OUT
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ 
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: '#0F172A',
                        lineHeight: '1.3'
                      }}>
                        {event.title}
                      </h3>
                      
                      <p style={{ 
                        color: '#64748B',
                        fontSize: '0.85rem',
                        marginBottom: '1rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                        lineHeight: '1.6'
                      }}>
                        {event.description}
                      </p>

                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        marginBottom: '1rem',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B' }}>
                          <span>📅</span>
                          <span>
                            {new Date(event.dateTime).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B' }}>
                          <span>📍</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {event.location}
                          </span>
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 'var(--spacing-sm)',
                        borderTop: '1px solid #E2E8F0',
                        marginTop: 'auto'
                      }}>
                        <span style={{ 
                          color: '#4F46E5',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>
                          {formatPrice(event.price, event.currency)}
                        </span>
                        <span style={{ 
                          color: event.isFull ? '#EF4444' : '#4F46E5',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {event.registrationCount}/{event.capacity}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && paginatedEvents.length > 0 && totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            marginTop: 'var(--spacing-xl)',
            padding: 'var(--spacing-lg) 0'
          }}>
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
            <span style={{ color: '#64748B', fontSize: '0.9rem' }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
