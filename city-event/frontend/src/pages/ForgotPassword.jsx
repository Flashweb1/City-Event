import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl)', background: '#F8FAFC' }}>
      <Helmet><title>Reset Password — City Event</title></Helmet>
      <div style={{ maxWidth: '450px', width: '100%', background: '#FFFFFF', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', color: '#0F172A', fontSize: '1.75rem', fontWeight: '700' }}>Reset Password</h2>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <p style={{ color: '#64748B', marginBottom: 'var(--spacing-md)' }}>
              Check your inbox at <strong style={{ color: '#4F46E5' }}>{email}</strong> for the password reset link.
            </p>
            <Link to="/login"><button className="btn-primary">Back to Login</button></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#64748B', marginBottom: 'var(--spacing-md)' }}>
              Enter your email and we'll send you a password reset link.
            </p>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: '#475569', fontWeight: '600' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            {error && <p style={{ color: '#EF4444', marginBottom: 'var(--spacing-md)', fontSize: '0.9rem' }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
              <Link to="/login" style={{ color: '#4F46E5', fontSize: '0.9rem', fontWeight: '500' }}>Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}