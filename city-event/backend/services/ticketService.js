/**
 * Ticket Service
 * Orchestrates the post-registration flow:
 * 1. Generate QR code data
 * 2. Generate PDF ticket (if available)
 * 3. Send confirmation email
 */
import { sendTicketConfirmation } from './emailService.js';
import { generateTicketPdf } from './pdfService.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Process a ticket after successful registration
 * @param {Object} params
 * @param {Object} params.db - PostgreSQL pool instance (fallback)
 * @param {Object} [params.fsdb] - Firestore adapter (preferred when USE_FIRESTORE=true)
 * @param {string} params.registrationId - The registration UUID
 * @param {string} params.eventId - Event UUID
 * @param {string} params.userId - User Firebase UID
 * @param {string} params.qrCodeData - The QR code string to store
 * @param {number} params.amountPaid - Amount paid (0 for free)
 */
export const processTicket = async ({
  db,
  fsdb,
  registrationId,
  eventId,
  userId,
  qrCodeData,
  amountPaid = 0,
}) => {
  let user, event;

  if (fsdb) {
    [user, event] = await Promise.all([
      fsdb.getDoc('profiles', userId),
      fsdb.getDoc('events', eventId),
    ]);
  } else {
    const [userRes, eventRes] = await Promise.all([
      db.query('SELECT email, full_name FROM profiles WHERE id = $1', [userId]),
      db.query('SELECT title, date_time, location FROM events WHERE id = $1', [eventId]),
    ]);
    user = userRes.rows[0];
    event = eventRes.rows[0];
  }

  if (!user || !event) {
    console.error('❌ Ticket processing failed: User or Event not found');
    return { success: false, error: 'User or Event not found' };
  }

  // Generate QR code data URL for email/PDF
  // We use a simple text-based approach — the QR code data is stored in DB
  // For the email, we create a link to the ticket page which renders the QR
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const ticketUrl = `${frontendUrl}/my-tickets?ticket=${registrationId}`;
  
  // QR code data is the raw string stored in the database
  // For email embedding, we provide the ticket URL that shows the QR code
  const eventDate = new Date(event.date_time).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Generate PDF ticket (async, non-blocking)
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateTicketPdf({
      attendeeName: user.full_name,
      eventTitle: event.title,
      eventDate,
      eventLocation: event.location,
      qrCodeDataUrl: null, // We don't generate QR image on server — user views it on the ticket page
      ticketId: registrationId,
      amountPaid,
    });
  } catch (err) {
    console.warn('⚠️ PDF generation skipped:', err.message);
  }

  // Save PDF to temp file for email attachment
  let pdfPath = null;
  if (pdfBuffer) {
    const tmpDir = os.tmpdir();
    pdfPath = path.join(tmpDir, `ticket-${registrationId}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
  }

  // Send confirmation email (fire and forget — don't block response)
  sendTicketConfirmation({
    to: user.email,
    attendeeName: user.full_name,
    eventTitle: event.title,
    eventDate,
    eventLocation: event.location,
    qrCodeDataUrl: null,
    ticketId: registrationId,
    amountPaid,
    pdfAttachmentPath: pdfPath,
  }).catch(err => {
    console.error('❌ Failed to send ticket email:', err.message);
  });

  // Clean up temp PDF after 5 minutes
  if (pdfPath) {
    setTimeout(() => {
      try {
        fs.unlinkSync(pdfPath);
      } catch (e) {
        // File already deleted
      }
    }, 5 * 60 * 1000);
  }

  return { success: true, ticketUrl };
};

/**
 * Update promo code usage count
 * @param {Object} db - PostgreSQL pool (ignored if fsdb provided)
 * @param {string} promoId
 * @param {Object} [opts]
 * @param {Object} [opts.fsdb] - Firestore adapter (preferred)
 */
export const incrementPromoUsage = async (db, promoId, opts = {}) => {
  try {
    if (opts.fsdb) {
      await opts.fsdb.increment('promo_codes', promoId, 'times_used', 1);
    } else {
      await db.query(
        'UPDATE promo_codes SET times_used = times_used + 1 WHERE id = $1',
        [promoId]
      );
    }
  } catch (err) {
    console.error('❌ Failed to increment promo usage:', err.message);
  }
};

export default {
  processTicket,
  incrementPromoUsage,
};