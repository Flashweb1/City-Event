import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { registrationsAPI, ticketsAPI, waitlistAPI, billingAPI, gdprAPI } from '../utils/api';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

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

  const handleCloseModal = useCallback(() => setSelectedTicket(null), []);

  useEffect(() => {
    if (!selectedTicket) return;
    const onKey = (e) => { if (e.key === 'Escape') handleCloseModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedTicket, handleCloseModal]);

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

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="section-elevated"
      style={{ minHeight: '100vh' }}
    >
      <Helmet><title>My Tickets — City Event</title></Helmet>
      <div className="container">
        <motion.h1
          className="section-title neon-text-cyan"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          MY TICKETS
        </motion.h1>

        {tickets.length === 0 ? (
          <motion.div
            className="section-header"
            style={{ padding: '4rem 0' }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎫</div>
            <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>No tickets yet</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
              Register for events to get your tickets
            </p>
            <a href="/events">
              <button className="btn-primary">Browse Events</button>
            </a>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-2"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {tickets.map(ticket => (
              <motion.div
                key={ticket.id}
                className="ticket-card"
                style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                variants={staggerItem}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div style={{
                  height: '180px',
                  background: `url(${ticket.event.imageUrl}) center/cover`,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: ticket.checkedIn ? 'var(--neon-cyan)' : 'var(--neon-yellow)',
                    color: 'var(--bg-deep)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {ticket.checkedIn ? '✓ Checked In' : 'Valid Ticket'}
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    marginBottom: '0.75rem',
                    color: '#ffffff'
                  }}>
                    {ticket.event.title}
                  </h3>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    marginBottom: '1rem',
                    color: 'rgba(255,255,255,0.5)',
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
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Billing / Payment Methods */}
        <motion.div
          className="hero-actions"
          style={{ marginTop: '2rem' }}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <button onClick={handlePortal} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>
            💳 Manage Payment Methods
          </button>
        </motion.div>

        {/* Privacy Section */}
        <motion.div
          className="profile-card"
          style={{ border: '1px solid rgba(255, 0, 110, 0.15)' }}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h3 style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>Privacy & Data</h3>
          <div className="hero-actions">
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
        </motion.div>

        {/* Waitlist Entries */}
        {waitlistEntries.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="section-title neon-text-cyan" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              WAITLIST
            </h2>
            <motion.div
              className="grid grid-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {waitlistEntries.map(w => (
                <motion.div key={w.id} className="ticket-card" variants={staggerItem} style={{ opacity: 0.7 }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#ffffff' }}>
                    {w.event.title}
                  </h3>
                  <p className="neon-text-yellow" style={{ fontSize: '0.9rem' }}>
                    ⏳ Waiting for spot
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    📅 {new Date(w.event.dateTime).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* QR Code Modal */}
        {selectedTicket && (
          <motion.div
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="glass-card-static"
              style={{
                padding: 'var(--spacing-xl)',
                maxWidth: '500px',
                width: '100%',
                border: '2px solid var(--neon-cyan)',
                boxShadow: '0 0 40px rgba(0, 245, 255, 0.3)',
                textAlign: 'center'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '1.5rem', color: '#ffffff' }}>
                {selectedTicket.event.title}
              </h2>

              <div style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
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
                background: 'rgba(0, 245, 255, 0.08)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem'
              }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  <strong className="neon-text-cyan">Event Details:</strong>
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                  📅 {new Date(selectedTicket.event.dateTime).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                  ⏰ {new Date(selectedTicket.event.dateTime).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit'
                  })}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                  📍 {selectedTicket.event.location}
                </p>
              </div>

              {selectedTicket.checkedIn && (
                <div className="neon-text-cyan" style={{
                  background: 'rgba(0, 245, 255, 0.08)',
                  border: '1px solid var(--neon-cyan)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  fontSize: '0.9rem'
                }}>
                  ✓ Checked in at {new Date(selectedTicket.checkedInAt).toLocaleString()}
                </div>
              )}

              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Show this QR code at the event entrance
              </p>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
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
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
