import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xxl) 0' }}>
      <Helmet><title>About — City Event</title></Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className="gradient-text" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>ABOUT CITY EVENT</h1>

        <section style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--light-gray)', fontSize: '1.2rem', lineHeight: '1.8', maxWidth: '600px', margin: '0 auto' }}>
            City Event is the all-in-one platform for discovering, creating, and managing unforgettable experiences. 
            From intimate workshops to massive festivals, we empower organizers and attendees alike.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
          {[
            { icon: '🎟️', title: 'Smart Ticketing', desc: 'QR code tickets, instant check-in, and real-time capacity management.' },
            { icon: '💳', title: 'Secure Payments', desc: 'Powered by Stripe with multi-currency support and instant refunds.' },
            { icon: '📊', title: 'Analytics', desc: 'Track registrations, revenue, and attendance in real time.' },
            { icon: '🌍', title: 'Global Reach', desc: 'Events in any city, any currency, any language.' },
          ].map(f => (
            <div key={f.title} style={{ background: 'var(--dark-gray)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--medium-gray)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>{f.icon}</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--light-gray)', fontSize: '0.9rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <section style={{ textAlign: 'center', padding: 'var(--spacing-xl)', background: 'var(--dark-gray)', borderRadius: 'var(--radius-md)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Contact Us</h2>
          <p style={{ color: 'var(--light-gray)', marginBottom: '0.5rem' }}>📧 hello@cityevent.com</p>
          <p style={{ color: 'var(--light-gray)', marginBottom: 'var(--spacing-lg)' }}>🐦 @cityevent</p>
          <Link to="/create-event"><button className="btn-primary">Start Creating Events</button></Link>
        </section>
      </div>
    </div>
  );
}