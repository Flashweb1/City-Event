import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
};

export default function TermsOfService() {
  const sections = [
    { title: '1. Acceptance of Terms', body: 'By using City Event, you agree to these terms. If you do not agree, do not use the platform.' },
    { title: '2. User Accounts', body: 'You are responsible for maintaining your account credentials. You must be at least 13 years old to use this platform.' },
    { title: '3. Event Listings', body: 'Organizers are responsible for the accuracy of their event listings. City Event reserves the right to remove listings that violate our policies.' },
    { title: '4. Payments & Refunds', body: 'Payments are processed securely via Stripe. Refund policies are set by event organizers. City Event charges a 5% platform fee on paid tickets.' },
    { title: '5. Limitation of Liability', body: 'City Event is a platform connecting organizers and attendees. We are not responsible for event quality, cancellations, or disputes between users.' },
    { title: '6. Changes to Terms', body: 'We may update these terms. Continued use after changes constitutes acceptance of the new terms.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
    >
      <Helmet><title>Terms of Service — City Event</title></Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.h1
          className="section-title neon-text-cyan"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          Terms of Service
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

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
          Last updated: June 2026
        </p>
      </div>
    </motion.div>
  );
}
