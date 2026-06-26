import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function About() {
  const features = [
    { icon: '🎟️', title: 'Smart Ticketing', desc: 'QR code tickets, instant check-in, and real-time capacity management.' },
    { icon: '💳', title: 'Secure Payments', desc: 'Powered by Stripe with multi-currency support and instant refunds.' },
    { icon: '📊', title: 'Analytics', desc: 'Track registrations, revenue, and attendance in real time.' },
    { icon: '🌍', title: 'Global Reach', desc: 'Events in any city, any currency, any language.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
    >
      <Helmet><title>About — City Event</title></Helmet>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.h1
          className="section-title neon-text-cyan"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          ABOUT CITY EVENT
        </motion.h1>

        <motion.section
          className="section-header"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.2rem', lineHeight: '1.8', maxWidth: '600px', margin: '0 auto' }}>
            City Event is the all-in-one platform for discovering, creating, and managing unforgettable experiences.
            From intimate workshops to massive festivals, we empower organizers and attendees alike.
          </p>
        </motion.section>

        <motion.div
          className="feature-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ marginBottom: '3rem' }}
        >
          {features.map(f => (
            <motion.div key={f.title} className="feature-card" variants={staggerItem}>
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.section
          className="profile-card"
          style={{ textAlign: 'center' }}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 style={{ marginBottom: '1rem', color: '#ffffff' }}>Contact Us</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '0.5rem' }}>📧 hello@cityevent.com</p>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1.5rem' }}>🐦 @cityevent</p>
          <Link to="/create-event"><button className="btn-primary">Start Creating Events</button></Link>
        </motion.section>
      </div>
    </motion.div>
  );
}
