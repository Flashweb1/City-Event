import { Helmet } from 'react-helmet-async';

export default function TermsOfService() {
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xxl) 0' }}>
      <Helmet><title>Terms of Service — City Event</title></Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xl)' }}>Terms of Service</h1>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>1. Acceptance of Terms</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>By using City Event, you agree to these terms. If you do not agree, do not use the platform.</p>
        </section>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>2. User Accounts</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>You are responsible for maintaining your account credentials. You must be at least 13 years old to use this platform.</p>
        </section>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>3. Event Listings</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>Organizers are responsible for the accuracy of their event listings. City Event reserves the right to remove listings that violate our policies.</p>
        </section>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>4. Payments & Refunds</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>Payments are processed securely via Stripe. Refund policies are set by event organizers. City Event charges a 5% platform fee on paid tickets.</p>
        </section>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>5. Limitation of Liability</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>City Event is a platform connecting organizers and attendees. We are not responsible for event quality, cancellations, or disputes between users.</p>
        </section>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>6. Changes to Terms</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>We may update these terms. Continued use after changes constitutes acceptance of the new terms.</p>
        </section>

        <p style={{ color: 'var(--light-gray)', fontSize: '0.85rem', textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>Last updated: June 2026</p>
      </div>
    </div>
  );
}