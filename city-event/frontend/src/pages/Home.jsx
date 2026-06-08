import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { eventsAPI } from '../utils/api';
import PricingTiers from '../components/PricingTiers';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80';

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsAPI.getAll()
      .then(events => setFeaturedEvents(events.slice(0, 3)))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Helmet>
        <title>City Event — Discover Events That Move You</title>
        <meta name="description" content="The global platform for unforgettable experiences. Book, explore, and experience amazing events in your city." />
        <meta property="og:title" content="City Event — Discover Events That Move You" />
        <meta property="og:description" content="The global platform for unforgettable experiences. Book, explore, and experience amazing events." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={HERO_IMAGE} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: `url(${HERO_IMAGE}) center center / cover no-repeat`
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.7) 50%, rgba(15,23,42,0.85) 100%)'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(0deg, rgba(15,23,42,0.4) 0%, transparent 50%)'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '2rem' }}>
          <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              fontWeight: '700',
              color: '#FFFFFF',
              lineHeight: '1.15',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Discover Events<br />
              <span style={{ color: '#818CF8' }}>That Move You</span>
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: '#CBD5E1',
              maxWidth: '600px',
              margin: '0 auto 2.5rem',
              lineHeight: '1.7',
              fontWeight: '400'
            }}>
              The global platform for unforgettable experiences. Book, explore, and connect with events in your city and beyond.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/events">
                <button style={{
                  background: '#4F46E5',
                  color: '#FFFFFF',
                  padding: '1rem 2.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '2px solid #4F46E5',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                  onMouseEnter={(e) => { e.target.style.background = '#4338CA'; e.target.style.borderColor = '#4338CA'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#4F46E5'; e.target.style.borderColor = '#4F46E5'; }}>
                  Explore Events
                </button>
              </Link>
              <Link to="/create-event">
                <button style={{
                  background: 'transparent',
                  color: '#FFFFFF',
                  padding: '1rem 2.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                  onMouseEnter={(e) => { e.target.style.borderColor = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; }}>
                  Create Event
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '4rem 0',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '2rem',
            textAlign: 'center'
          }}>
            {[
              { value: '10K+', label: 'Events Hosted', color: '#4F46E5' },
              { value: '500K+', label: 'Tickets Sold', color: '#4F46E5' },
              { value: '150+', label: 'Cities Worldwide', color: '#4F46E5' },
              { value: '24/7', label: 'Support', color: '#EF4444' }
            ].map((stat, idx) => (
              <div key={idx} style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1}s backwards` }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.25rem', color: stat.color }}>
                  {stat.value}
                </h2>
                <p style={{ color: '#64748B', fontSize: '1rem' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section style={{ padding: '5rem 0', background: '#F8FAFC' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ color: '#0F172A', marginBottom: '0.75rem' }}>Featured Events</h2>
            <p style={{ color: '#64748B', fontSize: '1.1rem' }}>Discover the most popular experiences happening now</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="grid grid-3">
              {featuredEvents.map(event => (
                <Link key={event.id} to={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card">
                    <div style={{
                      height: '220px',
                      background: `url(${event.imageUrl}) center center / cover`,
                      position: 'relative'
                    }}>
                      {event.category && (
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
                      )}
                      {event.isFull && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(15,23,42,0.6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <div style={{
                            background: '#EF4444', color: '#FFFFFF',
                            padding: '0.75rem 1.5rem', borderRadius: '8px',
                            fontSize: '1rem', fontWeight: '700'
                          }}>SOLD OUT</div>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: '#0F172A'
                      }}>
                        {event.title}
                      </h3>
                      <p style={{
                        color: '#64748B',
                        fontSize: '0.9rem',
                        marginBottom: '1rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.6'
                      }}>
                        {event.description}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '1rem',
                        borderTop: '1px solid #E2E8F0'
                      }}>
                        <div style={{ color: '#64748B', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>📍</span>
                          <span>{event.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ color: '#4F46E5', fontWeight: '600', fontSize: '0.9rem' }}>
                            {event.price && event.price > 0 ? `$${parseFloat(event.price).toFixed(2)}` : 'FREE'}
                          </span>
                          <span style={{
                            color: event.isFull ? '#EF4444' : '#4F46E5',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {event.registrationCount || 0}/{event.capacity || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/events">
              <button className="btn-primary">
                View All Events
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 0', background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ color: '#0F172A', marginBottom: '0.75rem' }}>Why City Event?</h2>
            <p style={{ color: '#64748B', fontSize: '1.1rem' }}>Everything you need to create and attend amazing events</p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { icon: '⚡', title: 'Instant QR Check-In', desc: 'Lightning-fast entry with our built-in QR scanner. No queues, no hassle.' },
              { icon: '🌍', title: 'Global Reach', desc: 'Connect with events and audiences worldwide. One platform, infinite possibilities.' },
              { icon: '📊', title: 'Real-Time Analytics', desc: 'Track attendance, engagement, and revenue in real-time. Data-driven events.' }
            ].map((f, idx) => (
              <div key={idx} style={{
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                transition: 'all 0.25s ease',
                animation: `slideUp 0.5s ease-out ${idx * 0.1}s backwards`
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4F46E5'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.75rem', color: '#0F172A' }}>
                  {f.title}
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: '1.7' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingTiers />

      {/* CTA */}
      <section style={{
        padding: '5rem 0',
        textAlign: 'center',
        background: '#F8FAFC',
        borderTop: '1px solid #E2E8F0'
      }}>
        <div className="container">
          <h2 style={{ color: '#0F172A', marginBottom: '0.75rem' }}>Ready to Get Started?</h2>
          <p style={{
            color: '#64748B',
            fontSize: '1.1rem',
            marginBottom: '2rem',
            maxWidth: '500px',
            margin: '0 auto 2rem'
          }}>
            Choose the perfect plan and join thousands of organizers and attendees creating unforgettable experiences.
          </p>
          <Link to="/login">
            <button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}>
              Sign Up Free
            </button>
          </Link>
          <p style={{ marginTop: '1.5rem', color: '#94A3B8', fontSize: '0.9rem' }}>
            Free tier includes all essential features &mdash; no credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0F172A',
        color: '#94A3B8',
        padding: '2rem 0',
        textAlign: 'center',
        fontSize: '0.85rem'
      }}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} City Event. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
            <Link to="/about" style={{ color: '#94A3B8', textDecoration: 'none' }}>About</Link>
            <Link to="/privacy" style={{ color: '#94A3B8', textDecoration: 'none' }}>Privacy</Link>
            <Link to="/terms" style={{ color: '#94A3B8', textDecoration: 'none' }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}