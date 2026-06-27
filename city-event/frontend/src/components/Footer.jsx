import { Link, useLocation } from 'react-router-dom';
import { X, Camera, Globe2, Mail } from 'lucide-react';
import Logo from './Logo';

function HomeFooter() {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: 'Explore',
      links: [
        { to: '/events', label: 'Browse Events' },
        { to: '/events', label: 'Featured Events' },
        { to: '/events', label: 'Popular Categories' },
        { to: '/events', label: 'Trending' },
      ],
    },
    {
      title: 'Company',
      links: [
        { to: '/about', label: 'About Us' },
        { to: '/about', label: 'Contact' },
        { to: '/about', label: 'Careers' },
        { to: '/about', label: 'Blog' },
      ],
    },
    {
      title: 'Support',
      links: [
        { to: '#', label: 'Help Center' },
        { to: '#', label: 'Safety' },
        { to: '#', label: 'Cancellations' },
        { to: '#', label: 'Report' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { to: '/privacy', label: 'Privacy Policy' },
        { to: '/terms', label: 'Terms of Service' },
        { to: '#', label: 'Cookie Policy' },
        { to: '#', label: 'GDPR' },
      ],
    },
  ];

  return (
    <footer className="bg-surface border-t border-white/5 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-16 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" animated={false} />
            <p className="text-sm text-muted mt-4 leading-relaxed max-w-xs">
              The global platform for unforgettable experiences. Create, discover, and manage events worldwide.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: X, label: 'Twitter', href: '#' },
                { icon: Camera, label: 'Instagram', href: '#' },
                { icon: Globe2, label: 'LinkedIn', href: '#' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="rounded-xl bg-white/5 border border-white/5 p-2.5 text-muted hover:text-text hover:bg-white/10 hover:border-white/10 transition-all duration-200"
                  aria-label={label}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-text mb-4 tracking-wide">{col.title}</h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted hover:text-text transition-colors duration-200 no-underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5 text-sm text-muted">
          <p>© {currentYear} City Event. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Mail size={14} />
              hello@cityevent.com
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Footer() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  if (isHome) {
    return <HomeFooter />;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: '#0a0a0a',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      padding: 'var(--spacing-xxl) 0 var(--spacing-lg)',
      marginTop: 'var(--spacing-xxl)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: -100,
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(0,245,255,0.04) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-xl)',
          paddingBottom: 'var(--spacing-xl)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div>
            <Logo size="sm" animated={false} />
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.9rem',
              marginTop: 'var(--spacing-md)',
              lineHeight: '1.6'
            }}>
              The global platform for unforgettable experiences. Create, discover, and manage events worldwide.
            </p>
          </div>

          {[
            { title: 'Product', links: [
              { to: '/events', label: 'Browse Events' },
              { to: '/create-event', label: 'Create Event' },
            ]},
            { title: 'Company', links: [
              { to: '/about', label: 'About' },
              { to: '/about', label: 'Contact' },
            ]},
            { title: 'Legal', links: [
              { to: '/privacy', label: 'Privacy' },
              { to: '/terms', label: 'Terms' },
            ]},
          ].map((group) => (
            <div key={group.title}>
              <h4 style={{
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: 'var(--spacing-md)',
                letterSpacing: '0.08em',
                opacity: 0.6
              }}>
                {group.title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {group.links.map((link) => (
                  <li key={link.label} style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <Link to={link.to} className="nav-link" style={{ fontSize: '0.9rem' }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-md)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>
            © {currentYear} City Event. All rights reserved.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {['𝕏', '📷', '💼'].map((icon, i) => (
              <a
                key={i}
                href="#"
                className="glass"
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--neon-cyan)';
                  e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }}
                title={['Twitter', 'Instagram', 'LinkedIn'][i]}
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
