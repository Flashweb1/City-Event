import { generateTicketPdf } from './pdfService.js';
import { sendTicketEmail } from './emailService.js';

export const processTicket = async ({ db, registrationId, eventId, userId, qrCodeData, amountPaid }) => {
  try {
    const result = await db.query(`
      SELECT r.*, e.title, e.date_time, e.location, p.full_name, p.email
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN profiles p ON r.user_id = p.id
      WHERE r.id = $1
    `, [registrationId]);

    const data = result.rows[0];
    if (!data) throw new Error('Registration not found');

    const pdfBuffer = await generateTicketPdf({
      attendeeName: data.full_name,
      eventTitle: data.title,
      eventDate: new Date(data.date_time).toLocaleString(),
      eventLocation: data.location,
      qrCodeData: qrCodeData,
      ticketId: registrationId,
      amountPaid: amountPaid
    });

    await sendTicketEmail(data.email, data.full_name, data.title, pdfBuffer);
    return true;
  } catch (err) {
    console.error(`Ticket processing failed: ${err.message}`);
    throw err;
  }
};