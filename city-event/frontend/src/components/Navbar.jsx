import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/auth';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <>
      {user && !user.emailVerified && (
        <div className="glass" style={{
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--neon-yellow)',
          fontWeight: 600,
          border: '1px solid rgba(255, 190, 11, 0.15)',
          borderRadius: 0
        }}>
          Please verify your email address. Check your inbox for a verification link.
        </div>
      )}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container navbar-inner">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" animated={false} />
          </Link>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/events" className="nav-link">Events</Link>
            <Link to="/my-events" className="nav-link">My Events</Link>
            <Link to="/wishlist" className="nav-link">Wishlist</Link>

            {user && (
              <>
                <Link to="/my-tickets" className="nav-link">My Tickets</Link>
                <Link to="/scanner" className="nav-link">Scanner</Link>
                {(user.role === 'organizer' || user.role === 'admin') && (
                  <Link to="/create-event" className="nav-link-highlight">+ Create Event</Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="nav-link">Admin</Link>
                )}
              </>
            )}

            {user ? (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Link to="/profile" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {user.fullName}
                </Link>
                <button onClick={handleLogout} className="btn-secondary btn-small">Logout</button>
              </div>
            ) : (
              <Link to="/login">
                <button className="btn-primary btn-small">Sign In</button>
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
              color: 'rgba(255,255,255,0.8)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu with Animation */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                overflow: 'hidden',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '0 var(--spacing-md) var(--spacing-md)',
                display: 'none'
              }}
            >
              <Link to="/events" className="nav-link" style={{ display: 'block', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setMobileOpen(false)}>Events</Link>
              <Link to="/my-events" className="nav-link" style={{ display: 'block', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setMobileOpen(false)}>My Events</Link>
              <Link to="/wishlist" className="nav-link" style={{ display: 'block', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setMobileOpen(false)}>Wishlist</Link>

              {user && (
                <>
                  <Link to="/my-tickets" className="nav-link" style={{ display: 'block', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setMobileOpen(false)}>My Tickets</Link>
                  <Link to="/scanner" className="nav-link" style={{ display: 'block', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setMobileOpen(false)}>Scanner</Link>
                  {(user.role === 'organizer' || user.role === 'admin') && (
                    <Link to="/create-event" className="nav-link-highlight" style={{ display: 'block', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setMobileOpen(false)}>+ Create Event</Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="nav-link" style={{ display: 'block', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setMobileOpen(false)}>Admin</Link>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem 0' }}>
                    <Link to="/profile" className="nav-link" onClick={() => setMobileOpen(false)}>{user.fullName}</Link>
                    <button onClick={handleLogout} className="btn-secondary btn-small">Logout</button>
                  </div>
                </>
              )}

              {!user && (
                <Link to="/login" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '0.75rem 0' }}>
                  <button className="btn-primary btn-small" style={{ width: '100%' }}>Sign In</button>
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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