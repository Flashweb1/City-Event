import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../utils/api';
import { useWishlist } from '../contexts/WishlistContext';

export default function Wishlist() {
  const [wishlistEvents, setWishlistEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetchWishlistEvents();
  }, [wishlist]);

  const fetchWishlistEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await eventsAPI.getAll();
      const favorited = allEvents.filter(e => wishlist.includes(e.id));
      setWishlistEvents(favorited);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xl) 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: 'var(--spacing-xl)',
          animation: 'slideUp 0.6s ease-out'
        }}>
          <h1 className="gradient-text">❤️ MY WISHLIST</h1>
          <p style={{ color: 'var(--light-gray)', fontSize: '1.1rem', marginTop: 'var(--spacing-sm)' }}>
            {wishlistEvents.length} event{wishlistEvents.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : wishlistEvents.length === 0 ? (
          <div style={{ 
            textAlign: 'center',
            padding: 'var(--spacing-xxl)',
            color: 'var(--light-gray)',
            animation: 'slideUp 0.6s ease-out'
          }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: 'var(--spacing-md)' }}>No saved events yet 💔</h3>
            <p style={{ fontSize: '1.1rem', marginBottom: 'var(--spacing-lg)' }}>Start adding events to your wishlist!</p>
            <Link to="/events">
              <button className="btn-primary">
                Browse Events
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-3">
            {wishlistEvents.map((event, idx) => (
              <div 
                key={event.id}
                style={{ animation: `slideUp 0.6s ease-out ${idx * 0.05}s backwards` }}
              >
                <div className="card" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Remove from Wishlist Button */}
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
                      background: 'rgba(255, 0, 110, 0.8)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    ❤️
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
                        top: 'var(--spacing-sm)',
                        right: 'var(--spacing-sm)',
                        background: 'var(--neon-cyan)',
                        color: 'var(--deep-black)',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {event.category}
                      </div>

                      {event.isFull && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0, 0, 0, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            background: 'var(--neon-pink)',
                            color: 'var(--pure-white)',
                            padding: '1rem 2rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '1rem',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}>
                            SOLD OUT
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: 'var(--spacing-md)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ 
                        fontSize: '1.3rem',
                        marginBottom: 'var(--spacing-sm)',
                        color: 'var(--pure-white)',
                        lineHeight: '1.3'
                      }}>
                        {event.title}
                      </h3>
                      
                      <p style={{ 
                        color: 'var(--light-gray)',
                        fontSize: '0.85rem',
                        marginBottom: 'var(--spacing-md)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1
                      }}>
                        {event.description}
                      </p>

                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-xs)',
                        marginBottom: 'var(--spacing-md)',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--light-gray)' }}>
                          <span>📅</span>
                          <span>
                            {new Date(event.dateTime).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--light-gray)' }}>
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
                        borderTop: '1px solid var(--medium-gray)',
                        marginTop: 'auto'
                      }}>
                        <span style={{ 
                          color: 'var(--neon-yellow)',
                          fontSize: '0.95rem',
                          fontWeight: '700'
                        }}>
                          {event.price && event.price > 0 ? `$${event.price.toFixed(2)}` : 'FREE'}
                        </span>
                        <span style={{ 
                          color: event.isFull ? 'var(--neon-pink)' : 'var(--neon-cyan)',
                          fontSize: '0.75rem',
                          fontWeight: '600'
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
      </div>
    </div>
  );
}
