import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cityevent_gdpr_consent';

export default function GDPRBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(10, 10, 26, 0.98)', backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(0, 245, 255, 0.15)',
      padding: '1rem 1.5rem',
      animation: 'slideUp 0.4s ease-out'
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem'
      }}>
        <p style={{ color: 'var(--light-gray)', fontSize: '0.9rem', margin: 0, flex: 1, minWidth: '200px' }}>
          🍪 We use cookies and analytics to improve your experience. By continuing, you agree to our{' '}
          <a href="/privacy" style={{ color: 'var(--neon-cyan)' }}>Privacy Policy</a>.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button onClick={reject} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            Reject
          </button>
          <button onClick={accept} className="btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}