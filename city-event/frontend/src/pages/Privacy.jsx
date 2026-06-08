import { Helmet } from 'react-helmet-async';

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xxl) 0' }}>
      <Helmet>
        <title>Privacy Policy — City Event</title>
        <meta name="description" content="City Event privacy policy and data handling practices." />
      </Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-xl)' }}>Privacy Policy</h1>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>1. Data We Collect</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>
            We collect information you provide when creating an account (name, email) and event registration data (event preferences, ticket purchases). We also collect anonymous usage analytics to improve our platform.
          </p>
        </section>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>2. How We Use Your Data</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>
            Your data is used to provide event registration services, process payments via Stripe, send ticket confirmations, and improve user experience. We never sell your personal data to third parties.
          </p>
        </section>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>3. Data Retention</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>
            We retain your account data until you choose to delete it. You can request data export or account deletion at any time from your account settings.
          </p>
        </section>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>4. Cookies</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>
            We use essential cookies for authentication and security. Analytics cookies help us understand platform usage. You can manage preferences via the cookie banner.
          </p>
        </section>

        <section style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>5. Your Rights (GDPR)</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>
            You have the right to access your data, request correction, request deletion (right to be forgotten), and data portability. Contact us at privacy@cityevent.com to exercise these rights.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-sm)' }}>6. Contact</h2>
          <p style={{ color: 'var(--light-gray)', lineHeight: '1.8' }}>
            For privacy-related inquiries: <a href="mailto:privacy@cityevent.com" style={{ color: 'var(--neon-cyan)' }}>privacy@cityevent.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}