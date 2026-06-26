import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/auth';
import { authAPI, gdprAPI } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail, getAuth } from 'firebase/auth';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
};

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile({ fullName });
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(getAuth(), user.email);
      toast.success('Password reset email sent');
    } catch (err) { toast.error(err.message); }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await gdprAPI.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cityevent-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Data exported');
    } catch (err) { toast.error(err.message); }
    finally { setExporting(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Permanently delete your account and all data? This cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure?')) return;
    setDeleting(true);
    try {
      await gdprAPI.deleteAccount();
      toast.success('Account deleted');
      setTimeout(() => window.location.href = '/', 1500);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
      style={{ minHeight: '100vh' }}
    >
      <Helmet><title>Profile — City Event</title></Helmet>
      <div className="profile-container">
        <motion.h1
          className="section-title neon-text-cyan"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          PROFILE
        </motion.h1>

        <motion.div
          className="profile-card"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <form onSubmit={handleSave}>
            <h2 style={{ marginBottom: '1.25rem', color: '#ffffff' }}>Account Details</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Email</label>
              <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.6, width: '100%', padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.95rem' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.95rem' }} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        <motion.div
          className="profile-card"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <h2 style={{ marginBottom: '1.25rem', color: '#ffffff' }}>Security</h2>
          <button onClick={handleResetPassword} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>
            🔑 Reset Password
          </button>
        </motion.div>

        <motion.div
          className="profile-card"
          style={{ border: '1px solid rgba(255, 0, 110, 0.2)' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <h2 style={{ marginBottom: '1.25rem', color: 'var(--neon-pink)' }}>Privacy & Data</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={handleExportData} disabled={exporting} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>
              {exporting ? 'Exporting...' : '📥 Export My Data'}
            </button>
            <button onClick={handleDeleteAccount} disabled={deleting} className="btn-danger" style={{ padding: '0.75rem 2rem' }}>
              {deleting ? 'Deleting...' : '🗑️ Delete Account'}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
