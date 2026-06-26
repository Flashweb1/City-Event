import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(getAuth(), email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      className="auth-form-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet><title>Reset Password — City Event</title></Helmet>
      <motion.div className="auth-form-card" variants={fadeUp} initial="hidden" animate="visible">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#ffffff', fontSize: '1.75rem', fontWeight: 700 }}>
          Reset Password
        </h2>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1rem' }}>
              Check your inbox at <strong className="neon-text-cyan">{email}</strong> for the password reset link.
            </p>
            <Link to="/login"><button className="btn-primary">Back to Login</button></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
              Enter your email and we'll send you a password reset link.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            {error && <p style={{ color: 'var(--neon-pink)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login" style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', fontWeight: 500 }}>Back to Login</Link>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
