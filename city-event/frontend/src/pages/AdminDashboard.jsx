import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="spinner" />
    </div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', minHeight: '80vh' }}>
      <h2 style={{ color: 'var(--neon-pink)' }}>Error</h2>
      <p style={{ color: 'var(--light-gray)' }}>{error}</p>
    </div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-xl)' }}>
      <h1 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--spacing-xl)' }}>⚙️ Admin Control Panel</h1>

      {/* Analytics */}
      {analytics && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)'
        }}>
          {[
            { label: 'Total Revenue', value: `$${analytics.totalRevenue.toFixed(2)}`, color: 'var(--neon-cyan)' },
            { label: 'Tickets Sold', value: analytics.totalRegistrations, color: 'var(--neon-pink)' },
            { label: 'Total Events', value: analytics.totalEvents, color: 'var(--neon-yellow)' },
            { label: 'Total Users', value: analytics.totalUsers, color: '#8338ec' },
          ].map(s => (
            <div key={s.label} style={{
              backgroundColor: 'var(--dark-gray)', padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${s.color}`
            }}>
              <h3 style={{ color: 'var(--light-gray)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{s.label}</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Event Moderation */}
      <div style={{
        backgroundColor: 'var(--dark-gray)', padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-xl)'
      }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>
          Pending Events {pendingEvents.length > 0 && <span style={{ color: 'var(--neon-yellow)', fontSize: '0.8em' }}>({pendingEvents.length})</span>}
        </h2>
        {pendingEvents.length === 0 ? (
          <p style={{ color: 'var(--light-gray)' }}>No events pending approval.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {pendingEvents.map(event => (
              <div key={event.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--spacing-md)', background: 'var(--medium-gray)',
                borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '1rem'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <Link to={`/events/${event.id}`} style={{ color: 'var(--pure-white)', fontWeight: '700', textDecoration: 'none' }}>
                    {event.title}
                  </Link>
                  <p style={{ color: 'var(--light-gray)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    by {event.organizerName} | {event.category}
                  </p>
                  <p style={{ color: 'var(--light-gray)', fontSize: '0.8rem' }}>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management */}
      <div style={{
        backgroundColor: 'var(--dark-gray)', padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-md)', overflowX: 'auto'
      }}>
        <h2>User Management</h2>
        <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--light-gray)' }}>
          Change user permissions across the platform.
        </p>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--medium-gray)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Joined</th>
              <th style={{ padding: '1rem' }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem' }}>{u.fullName || u.full_name || 'Unknown'}</td>
                <td style={{ padding: '1rem' }}>{u.email}</td>
                <td style={{ padding: '1rem' }}>
                  {new Date(u.createdAt || u.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    style={{
                      padding: '0.5rem 1rem', backgroundColor: 'var(--medium-gray)',
                      color: 'var(--pure-white)', borderRadius: 'var(--radius-sm)',
                      border: '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem'
                    }}
                  >
                    <option value="student">Student</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--light-gray)', padding: 'var(--spacing-xl)' }}>
            No users found
          </p>
        )}
      </div>
    </div>
  );
}