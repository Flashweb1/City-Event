/**
 * Ticket Service
 * Orchestrates the post-registration flow:
 * 1. Generate QR code data
 * 2. Generate PDF ticket (if available)
 * 3. Send confirmation email
 */
import { sendTicketConfirmation } from './emailService.js';
import { generateTicketPdf } from './pdfService.js';
import { logger } from '../logger.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Process a ticket after successful registration
 * @param {Object} params
 * @param {Object} params.fsdb - Firestore adapter
 * @param {string} params.registrationId - The registration UUID
 * @param {string} params.eventId - Event UUID
 * @param {string} params.userId - User Firebase UID
 * @param {string} params.qrCodeData - The QR code string to store
 * @param {number} params.amountPaid - Amount paid (0 for free)
 */
export const processTicket = async ({
  fsdb,
  registrationId,
  eventId,
  userId,
  qrCodeData,
  amountPaid = 0,
}) => {
  let user, event;

  [user, event] = await Promise.all([
    fsdb.getDoc('profiles', userId),
    fsdb.getDoc('events', eventId),
  ]);

  if (!user || !event) {
    logger.error({ userId, eventId }, 'Ticket processing failed: User or Event not found');
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
    logger.warn({ err }, 'PDF generation skipped');
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
    logger.error({ err, userId }, 'Failed to send ticket email');
  });

  // Clean up temp PDF after 5 minutes. unref() so this timer does not
  // keep the Node event loop alive (important in serverless / Firebase
  // Functions cold starts and graceful shutdowns).
  if (pdfPath) {
    const cleanupTimer = setTimeout(() => {
      try {
        fs.unlinkSync(pdfPath);
      } catch (e) {
        // File already deleted
      }
    }, 5 * 60 * 1000);
    if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();
  }

  return { success: true, ticketUrl };
};

/**
 * Update promo code usage count
 * @param {string} promoId
 * @param {Object} fsdb - Firestore adapter
 */
export const incrementPromoUsage = async (promoId, fsdb) => {
  try {
    await fsdb.increment('promo_codes', promoId, 'times_used', 1);
  } catch (err) {
    logger.error({ err, promoId }, 'Failed to increment promo usage');
  }
};

export default {
  processTicket,
  incrementPromoUsage,
};