import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--dark-gray)',
      borderTop: '1px solid var(--medium-gray)',
      padding: 'var(--spacing-xxl) 0 var(--spacing-lg)',
      marginTop: 'var(--spacing-xxl)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: -100,
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-xl)',
          paddingBottom: 'var(--spacing-xl)',
          borderBottom: '1px solid var(--medium-gray)'
        }}>
          {/* Brand Section */}
          <div>
            <Logo size="sm" animated={false} />
            <p style={{
              color: 'var(--light-gray)',
              fontSize: '0.9rem',
              marginTop: 'var(--spacing-md)',
              lineHeight: '1.6'
            }}>
              The global platform for unforgettable experiences. Create, discover, and manage events worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              color: 'var(--pure-white)',
              fontSize: '0.95rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: 'var(--spacing-md)',
              letterSpacing: '0.05em'
            }}>
              Product
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <Link to="/events" style={{
                  color: 'var(--light-gray)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0284c7'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  Browse Events
                </Link>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <Link to="/create-event" style={{
                  color: 'var(--light-gray)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0284c7'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  Create Event
                </Link>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'var(--light-gray)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0284c7'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 style={{
              color: 'var(--pure-white)',
              fontSize: '0.95rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: 'var(--spacing-md)',
              letterSpacing: '0.05em'
            }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'var(--light-gray)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0284c7'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  About
                </a>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'var(--light-gray)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0284c7'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  Contact
                </a>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'var(--light-gray)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0284c7'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 style={{
              color: 'var(--pure-white)',
              fontSize: '0.95rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: 'var(--spacing-md)',
              letterSpacing: '0.05em'
            }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'var(--light-gray)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0284c7'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  Privacy
                </a>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'var(--light-gray)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0284c7'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  Terms
                </a>
              </li>
              <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a href="#" style={{
                  color: 'var(--light-gray)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0284c7'}
                onMouseLeave={(e) => e.target.style.color = '#475569'}>
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-md)',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#475569',
            fontSize: '0.85rem',
            margin: 0
          }}>
            © {currentYear} City Event. All rights reserved.
          </p>

          {/* Social Links */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            justifyContent: 'center'
          }}>
            <a href="#" style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--medium-gray)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--light-gray)',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              fontSize: '1.2rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#0284c7';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#e2e8f0';
              e.target.style.color = '#475569';
            }}
            title="Twitter">
              𝕏
            </a>
            <a href="#" style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--medium-gray)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--light-gray)',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              fontSize: '1.2rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#db2777';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#e2e8f0';
              e.target.style.color = '#475569';
            }}
            title="Instagram">
              📷
            </a>
            <a href="#" style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--medium-gray)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--light-gray)',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              fontSize: '1.2rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ca8a04';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#e2e8f0';
              e.target.style.color = '#475569';
            }}
            title="LinkedIn">
              💼
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
