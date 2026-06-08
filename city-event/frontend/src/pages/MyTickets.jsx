import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { registrationsAPI, ticketsAPI, waitlistAPI, billingAPI, gdprAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function MyTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const handleDownloadPdf = async (ticketId, eventTitle, e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const blob = await ticketsAPI.downloadPdf(ticketId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF ticket downloaded!');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleCancel = async (ticketId, e) => {
    e.stopPropagation();
    if (!window.confirm('Cancel this registration? If paid, a refund will be processed.')) return;
    setCancelling(ticketId);
    try {
      await registrationsAPI.cancel(ticketId);
      toast.success('Registration cancelled');
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    } catch (err) {
      toast.error(err.message || 'Cancellation failed');
    } finally { setCancelling(null); }
  };

  const handlePortal = async () => {
    try {
      const res = await billingAPI.createPortalSession();
      window.location.href = res.url;
    } catch (err) {
      toast.error('Failed to open billing portal');
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await gdprAPI.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cityevent-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Data exported');
    } catch (err) { toast.error(err.message); }
    finally { setExporting(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ Permanently delete your account and all data? This cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure? All tickets, registrations, and personal data will be lost.')) return;
    setDeleting(true);
    try {
      await gdprAPI.deleteAccount();
      toast.success('Account deleted');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  useEffect(() => {
    Promise.all([
      registrationsAPI.getMyTickets(),
      waitlistAPI.getMyList().catch(() => [])
    ])
      .then(([tickets, waitlist]) => {
        setTickets(tickets);
        setWaitlistEntries(waitlist);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    registrationsAPI.getMyTickets()
      .then(setTickets)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '80vh'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--spacing-xl) 0' }}>
      <div className="container">
        <h1 className="gradient-text" style={{ 
          textAlign: 'center',
          marginBottom: 'var(--spacing-xl)'
        }}>
          MY TICKETS
        </h1>

        {tickets.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-xxl)',
            color: 'var(--light-gray)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>🎫</div>
            <h3>No tickets yet</h3>
            <p style={{ marginBottom: 'var(--spacing-lg)' }}>
              Register for events to get your tickets
            </p>
            <a href="/events">
              <button className="btn-primary">Browse Events</button>
            </a>
          </div>
        ) : (
          <div className="grid grid-2">
            {tickets.map(ticket => (
              <div 
                key={ticket.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div style={{
                  height: '180px',
                  background: `url(${ticket.event.imageUrl}) center/cover`,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 'var(--spacing-sm)',
                    right: 'var(--spacing-sm)',
                    background: ticket.checkedIn ? 'var(--neon-cyan)' : 'var(--neon-yellow)',
                    color: 'var(--deep-black)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    {ticket.checkedIn ? '✓ Checked In' : 'Valid Ticket'}
                  </div>
                </div>

                <div style={{ padding: 'var(--spacing-md)' }}>
                  <h3 style={{ 
                    fontSize: '1.3rem',
                    marginBottom: 'var(--spacing-sm)',
                    color: 'var(--pure-white)'
                  }}>
                    {ticket.event.title}
                  </h3>

                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--light-gray)',
                    fontSize: '0.9rem'
                  }}>
                    <div>📅 {new Date(ticket.event.dateTime).toLocaleDateString()}</div>
                    <div>⏰ {new Date(ticket.event.dateTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}</div>
                    <div>📍 {ticket.event.location}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
                    >
                      View QR Code
                    </button>
                    <button
                      onClick={(e) => handleCancel(ticket.id, e)}
                      disabled={cancelling === ticket.id}
                      className="btn-danger"
                      style={{
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        opacity: cancelling === ticket.id ? 0.5 : 1,
                        cursor: cancelling === ticket.id ? 'wait' : 'pointer'
                      }}
                    >
                      {cancelling === ticket.id ? '...' : '✕'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Billing / Payment Methods */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <button onClick={handlePortal} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>
            💳 Manage Payment Methods
          </button>
        </div>

        {/* GDPR / Privacy */}
        <div style={{
          textAlign: 'center', marginBottom: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)', background: 'var(--dark-gray)',
          borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--light-gray)' }}>Privacy & Data</h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleExportData} disabled={exporting} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>
              {exporting ? 'Exporting...' : '📥 Export My Data (GDPR)'}
            </button>
            <button onClick={handleDeleteAccount} disabled={deleting} className="btn-danger" style={{ padding: '0.75rem 2rem' }}>
              {deleting ? 'Deleting...' : '🗑️ Delete My Account'}
            </button>
            <a href="/privacy" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.75rem 2rem', color: 'var(--neon-cyan)', textDecoration: 'none' }}>
              📄 Privacy Policy
            </a>
          </div>
        </div>

        {/* Waitlist Entries */}
        {waitlistEntries.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', fontSize: '1.5rem' }}>
              WAITLIST
            </h2>
            <div className="grid grid-2">
              {waitlistEntries.map(w => (
                <div key={w.id} className="card" style={{ opacity: 0.8 }}>
                  <div style={{ padding: 'var(--spacing-md)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--pure-white)' }}>
                      {w.event.title}
                    </h3>
                    <p style={{ color: 'var(--neon-yellow)', fontSize: '0.9rem' }}>
                      ⏳ Waiting for spot
                    </p>
                    <p style={{ color: 'var(--light-gray)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      📅 {new Date(w.event.dateTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {selectedTicket && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 'var(--spacing-md)',
              backdropFilter: 'blur(10px)'
            }}
            onClick={() => setSelectedTicket(null)}
          >
            <div
              style={{
                background: 'var(--dark-gray)',
                padding: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '500px',
                width: '100%',
                border: '2px solid var(--neon-cyan)',
                boxShadow: '0 0 40px rgba(0, 245, 255, 0.3)',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>
                {selectedTicket.event.title}
              </h2>

              <div style={{
                background: 'white',
                padding: 'var(--spacing-lg)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-md)',
                display: 'inline-block'
              }}>
                <QRCodeSVG 
                  value={selectedTicket.qrCodeData}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div style={{
                background: 'rgba(0, 245, 255, 0.1)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <p style={{ 
                  color: 'var(--light-gray)',
                  fontSize: '0.9rem',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  <strong style={{ color: 'var(--neon-cyan)' }}>Event Details:</strong>
                </p>
                <p style={{ color: 'var(--light-gray)', fontSize: '0.9rem' }}>
                  📅 {new Date(selectedTicket.event.dateTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p style={{ color: 'var(--light-gray)', fontSize: '0.9rem' }}>
                  ⏰ {new Date(selectedTicket.event.dateTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
                <p style={{ color: 'var(--light-gray)', fontSize: '0.9rem' }}>
                  📍 {selectedTicket.event.location}
                </p>
              </div>

              {selectedTicket.checkedIn && (
                <div style={{
                  background: 'rgba(0, 245, 255, 0.1)',
                  border: '1px solid var(--neon-cyan)',
                  color: 'var(--neon-cyan)',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '0.9rem'
                }}>
                  ✓ Checked in at {new Date(selectedTicket.checkedInAt).toLocaleString()}
                </div>
              )}

              <p style={{ 
                color: 'var(--light-gray)',
                fontSize: '0.85rem',
                marginBottom: 'var(--spacing-md)'
              }}>
                Show this QR code at the event entrance
              </p>

              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                <button
                  onClick={(e) => handleDownloadPdf(selectedTicket.id, selectedTicket.event.title, e)}
                  disabled={downloading}
                  className="btn-primary"
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem',
                    opacity: downloading ? 0.5 : 1,
                    cursor: downloading ? 'wait' : 'pointer'
                  }}
                >
                  {downloading ? 'Downloading...' : '📥 Download PDF'}
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
