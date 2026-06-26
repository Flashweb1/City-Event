import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
};

export default function Privacy() {
  const sections = [
    { title: '1. Data We Collect', body: 'We collect information you provide when creating an account (name, email) and event registration data (event preferences, ticket purchases). We also collect anonymous usage analytics to improve our platform.' },
    { title: '2. How We Use Your Data', body: 'Your data is used to provide event registration services, process payments via Stripe, send ticket confirmations, and improve user experience. We never sell your personal data to third parties.' },
    { title: '3. Data Retention', body: 'We retain your account data until you choose to delete it. You can request data export or account deletion at any time from your account settings.' },
    { title: '4. Cookies', body: 'We use essential cookies for authentication and security. Analytics cookies help us understand platform usage. You can manage preferences via the cookie banner.' },
    { title: '5. Your Rights (GDPR)', body: 'You have the right to access your data, request correction, request deletion (right to be forgotten), and data portability. Contact us at privacy@cityevent.com to exercise these rights.' },
    { title: '6. Contact', body: <>For privacy-related inquiries: <a href="mailto:privacy@cityevent.com" style={{ color: 'var(--neon-cyan)' }}>privacy@cityevent.com</a></> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
    >
      <Helmet>
        <title>Privacy Policy — City Event</title>
        <meta name="description" content="City Event privacy policy and data handling practices." />
      </Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.h1
          className="section-title neon-text-cyan"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          Privacy Policy
        </motion.h1>

        {sections.map((s, i) => (
          <motion.section
            key={s.title}
            className="profile-card"
            style={{ marginBottom: '1.5rem' }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={i}
          >
            <h2 style={{ color: 'var(--neon-cyan)', marginBottom: '0.75rem' }}>{s.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.8' }}>{s.body}</p>
          </motion.section>
        ))}
      </div>
    </motion.div>
  );
}
