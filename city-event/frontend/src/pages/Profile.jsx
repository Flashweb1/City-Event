import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useAuth } from '../utils/auth';
import { authAPI, gdprAPI } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail, getAuth } from 'firebase/auth';

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
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xl) 0' }}>
      <Helmet><title>Profile — City Event</title></Helmet>
      <div className="container" style={{ maxWidth: '700px' }}>
        <h1 className="gradient-text" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>PROFILE</h1>

        <form onSubmit={handleSave} style={{ background: 'var(--dark-gray)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--medium-gray)', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Account Details</h2>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>Email</label>
            <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--light-gray)', fontWeight: '600' }}>Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div style={{ background: 'var(--dark-gray)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--medium-gray)', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Security</h2>
          <button onClick={handleResetPassword} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>
            🔑 Reset Password
          </button>
        </div>

        <div style={{ background: 'var(--dark-gray)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 0, 110, 0.2)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--neon-pink)' }}>Privacy & Data</h2>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <button onClick={handleExportData} disabled={exporting} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>
              {exporting ? 'Exporting...' : '📥 Export My Data'}
            </button>
            <button onClick={handleDeleteAccount} disabled={deleting} className="btn-danger" style={{ padding: '0.75rem 2rem' }}>
              {deleting ? 'Deleting...' : '🗑️ Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}