import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navLinkStyle = {
    color: 'var(--pure-white)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    letterSpacing: '-0.01em',
    transition: 'color 0.2s ease',
    display: 'block',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--medium-gray)'
  };

  return (
    <>
      {user && !user.emailVerified && (
        <div style={{
          background: 'var(--neon-yellow)',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#FFFFFF',
          fontWeight: '600'
        }}>
          Please verify your email address. Check your inbox for a verification link.
        </div>
      )}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem var(--spacing-md)'
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" animated={false} />
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
            <Link to="/events" style={{
              ...navLinkStyle, borderBottom: 'none', padding: '0.5rem 0',
              color: '#475569', fontWeight: '500', fontSize: '0.9rem',
              position: 'relative'
            }}
              onMouseEnter={(e) => e.target.style.color = 'var(--neon-cyan)'}
              onMouseLeave={(e) => e.target.style.color = '#475569'}>
              Events
            </Link>

            <Link to="/my-events" style={{
              ...navLinkStyle, borderBottom: 'none', padding: '0.5rem 0',
              color: '#475569', fontWeight: '500', fontSize: '0.9rem'
            }}
              onMouseEnter={(e) => e.target.style.color = 'var(--neon-cyan)'}
              onMouseLeave={(e) => e.target.style.color = '#475569'}>
              My Events
            </Link>

            <Link to="/wishlist" style={{
              ...navLinkStyle, borderBottom: 'none', padding: '0.5rem 0',
              color: '#475569', fontWeight: '500', fontSize: '0.9rem'
            }}
              onMouseEnter={(e) => e.target.style.color = 'var(--neon-pink)'}
              onMouseLeave={(e) => e.target.style.color = '#475569'}>
              Wishlist
            </Link>

            {user && (
              <>
                <Link to="/my-tickets" style={{
                  ...navLinkStyle, borderBottom: 'none', padding: '0.5rem 0',
                  color: '#475569', fontWeight: '500', fontSize: '0.9rem'
                }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--neon-cyan)'}
                  onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  My Tickets
                </Link>

                <Link to="/scanner" style={{
                  ...navLinkStyle, borderBottom: 'none', padding: '0.5rem 0',
                  color: '#475569', fontWeight: '500', fontSize: '0.9rem'
                }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--neon-cyan)'}
                  onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  Scanner
                </Link>

                {(user.role === 'organizer' || user.role === 'admin') && (
                  <Link to="/create-event" style={{
                    ...navLinkStyle, borderBottom: 'none', padding: '0.5rem 0',
                    color: 'var(--neon-cyan)', fontWeight: '600', fontSize: '0.9rem'
                  }}>
                    + Create Event
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link to="/admin" style={{
                    ...navLinkStyle, borderBottom: 'none', padding: '0.5rem 0',
                    color: '#475569', fontWeight: '500', fontSize: '0.9rem'
                  }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--neon-pink)'}
                    onMouseLeave={(e) => e.target.style.color = '#475569'}>
                    Admin
                  </Link>
                )}
              </>
            )}

            {user ? (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Link to="/profile" style={{
                  color: '#475569',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  {user.fullName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary btn-small"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="btn-primary btn-small">
                  Sign In
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--pure-white)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="mobile-nav" style={{
            padding: '0 var(--spacing-md) var(--spacing-md)',
            borderTop: '1px solid var(--medium-gray)',
            display: 'none',
            background: '#FFFFFF'
          }}>
            <Link to="/events" style={navLinkStyle} onClick={() => setMobileOpen(false)}>Events</Link>
            <Link to="/my-events" style={navLinkStyle} onClick={() => setMobileOpen(false)}>My Events</Link>
            <Link to="/wishlist" style={navLinkStyle} onClick={() => setMobileOpen(false)}>Wishlist</Link>

            {user && (
              <>
                <Link to="/my-tickets" style={navLinkStyle} onClick={() => setMobileOpen(false)}>My Tickets</Link>
                <Link to="/scanner" style={navLinkStyle} onClick={() => setMobileOpen(false)}>Scanner</Link>
                {(user.role === 'organizer' || user.role === 'admin') && (
                  <Link to="/create-event" style={{ ...navLinkStyle, color: 'var(--neon-cyan)', fontWeight: '600' }} onClick={() => setMobileOpen(false)}>
                    + Create Event
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" style={navLinkStyle} onClick={() => setMobileOpen(false)}>Admin</Link>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem 0' }}>
                  <Link to="/profile" style={{ color: '#475569', fontSize: '0.9rem', textDecoration: 'none', fontWeight: '500' }}>
                    {user.fullName}
                  </Link>
                  <button onClick={handleLogout} className="btn-secondary btn-small">Logout</button>
                </div>
              </>
            )}

            {!user && (
              <Link to="/login" onClick={() => setMobileOpen(false)} style={{ ...navLinkStyle, borderBottom: 'none' }}>
                <button className="btn-primary btn-small" style={{ width: '100%' }}>Sign In</button>
              </Link>
            )}
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .mobile-menu-btn { display: block !important; }
            .mobile-nav { display: block !important; }
          }
        `}</style>
      </nav>
    </>
  );
}