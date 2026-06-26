import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') { navigate('/'); return; }
    if (user?.role === 'admin') fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [usersData, analyticsData, pendingData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getAnalytics(),
        adminAPI.getPendingEvents().catch(() => [])
      ]);
      setUsers(usersData);
      setAnalytics(analyticsData);
      setPendingEvents(pendingData);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load admin data');
    } finally { setLoading(false); }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch (err) { toast.error(err.message); }
  };

  const handleModeration = async (eventId, status) => {
    try {
      await adminAPI.updateEventStatus(eventId, status);
      setPendingEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success(`Event ${status}`);
    } catch (err) { toast.error(err.message); }
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>;
  }

  if (error) {
    return (
      <motion.div
        className="page-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ minHeight: '80vh' }}
      >
        <h2 className="neon-text-pink">Error</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>{error}</p>
      </motion.div>
    );
  }

  const statCards = analytics ? [
    { label: 'Total Revenue', value: `$${analytics.totalRevenue.toFixed(2)}`, color: 'var(--neon-cyan)' },
    { label: 'Tickets Sold', value: analytics.totalRegistrations, color: 'var(--neon-pink)' },
    { label: 'Total Events', value: analytics.totalEvents, color: 'var(--neon-yellow)' },
    { label: 'Total Users', value: analytics.totalUsers, color: '#8338ec' },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="admin-container"
      style={{ maxWidth: '1200px', margin: '0 auto' }}
    >
      <Helmet><title>Admin Dashboard — City Event</title></Helmet>
      <motion.h1
        className="section-title neon-text-cyan"
        style={{ marginBottom: '2rem' }}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        ⚙️ Admin Control Panel
      </motion.h1>

      {/* Analytics */}
      {analytics && (
        <motion.div
          className="admin-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {statCards.map(s => (
            <motion.div
              key={s.label}
              className="admin-card admin-stat"
              style={{ borderLeft: `4px solid ${s.color}` }}
              variants={staggerItem}
            >
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value" style={{ color: s.color }}>{s.value}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Event Moderation */}
      <motion.div
        className="admin-card"
        style={{ marginBottom: '2rem' }}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <h2 style={{ marginBottom: '1rem', color: '#ffffff' }}>
          Pending Events {pendingEvents.length > 0 && <span className="neon-text-yellow" style={{ fontSize: '0.8em' }}>({pendingEvents.length})</span>}
        </h2>
        {pendingEvents.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>No events pending approval.</p>
        ) : (
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {pendingEvents.map(event => (
              <motion.div
                key={event.id}
                className="profile-card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
                variants={staggerItem}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <Link to={`/events/${event.id}`} style={{ color: '#ffffff', fontWeight: 700, textDecoration: 'none' }}>
                    {event.title}
                  </Link>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    by {event.organizerName} | {event.category}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                    {new Date(event.dateTime).toLocaleDateString()} | {event.location}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleModeration(event.id, 'approved')} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                    ✓ Approve
                  </button>
                  <button onClick={() => handleModeration(event.id, 'rejected')} className="btn-danger" style={{ padding: '0.5rem 1.5rem' }}>
                    ✕ Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* User Management */}
      <motion.div
        className="admin-card"
        style={{ overflowX: 'auto' }}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <h2 style={{ marginBottom: '0.5rem', color: '#ffffff' }}>User Management</h2>
        <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.5)' }}>
          Change user permissions across the platform.
        </p>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '1rem', color: 'var(--neon-cyan)' }}>Name</th>
              <th style={{ padding: '1rem', color: 'var(--neon-cyan)' }}>Email</th>
              <th style={{ padding: '1rem', color: 'var(--neon-cyan)' }}>Joined</th>
              <th style={{ padding: '1rem', color: 'var(--neon-cyan)' }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '1rem', color: '#ffffff' }}>{u.fullName || u.full_name || 'Unknown'}</td>
                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{u.email}</td>
                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                  {new Date(u.createdAt || u.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="student" style={{ background: '#1a1a1a' }}>Student</option>
                    <option value="organizer" style={{ background: '#1a1a1a' }}>Organizer</option>
                    <option value="admin" style={{ background: '#1a1a1a' }}>Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>No users found</p>
        )}
      </motion.div>
    </motion.div>
  );
}
