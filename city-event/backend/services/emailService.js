import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter = null;

/**
 * Initialize the email transporter using SMTP settings from environment variables
 */
const getTransporter = () => {
  if (transporter) return transporter;

  // In development/test mode, use a fake transporter that logs instead of sending
  if (process.env.NODE_ENV === 'test' || !process.env.SMTP_HOST) {
    transporter = {
      sendMail: async (options) => {
        console.log('📧 [DEV] Email would be sent:', {
          to: options.to,
          subject: options.subject,
          htmlLength: options.html?.length || 0,
        });
        return { messageId: `dev-${Date.now()}@cityevent.local` };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Send a ticket confirmation email with QR code
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.attendeeName - Full name of attendee
 * @param {string} params.eventTitle - Event name
 * @param {string} params.eventDate - Event date/time string
 * @param {string} params.eventLocation - Event location
 * @param {string} params.qrCodeDataUrl - Base64 data URL of QR code
 * @param {string} params.ticketId - Unique ticket identifier
 * @param {number} params.amountPaid - Amount paid (0 for free events)
 * @param {string} params.pdfAttachmentPath - Optional path to PDF attachment
 */
export const sendTicketConfirmation = async ({
  to,
  attendeeName,
  eventTitle,
  eventDate,
  eventLocation,
  qrCodeDataUrl,
  ticketId,
  amountPaid = 0,
  pdfAttachmentPath = null,
}) => {
  const mailTransport = getTransporter();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00f5ff, #8338ec); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
    .header p { color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 10px; }
    .content { padding: 30px; }
    .event-details { background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #00f5ff; }
    .event-details h2 { color: #0a0a0a; font-size: 22px; margin: 0 0 15px 0; }
    .detail-row { display: flex; align-items: center; margin-bottom: 12px; color: #555; font-size: 15px; }
    .detail-row:last-child { margin-bottom: 0; }
    .detail-label { font-weight: 600; color: #333; min-width: 80px; }
    .qr-section { text-align: center; padding: 20px; background: #ffffff; border: 2px dashed #ddd; border-radius: 12px; margin: 20px 0; }
    .qr-section img { width: 200px; height: 200px; display: inline-block; }
    .qr-section p { color: #888; font-size: 14px; margin-top: 10px; }
    .ticket-id { text-align: center; font-size: 14px; color: #888; margin: 10px 0; }
    .ticket-id strong { color: #0a0a0a; letter-spacing: 1px; }
    .price-info { text-align: center; padding: 15px; background: linear-gradient(135deg, rgba(0,245,255,0.1), rgba(131,56,236,0.1)); border-radius: 8px; margin: 20px 0; }
    .price-info .amount { font-size: 24px; font-weight: 800; color: #0a0a0a; }
    .price-info .label { font-size: 13px; color: #666; }
    .footer { padding: 20px 30px; text-align: center; background: #f8f9fa; border-top: 1px solid #eee; }
    .footer p { color: #888; font-size: 13px; margin: 5px 0; }
    .footer a { color: #00f5ff; text-decoration: none; }
    .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #00f5ff, #8338ec); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 15px; text-transform: uppercase; letter-spacing: 1px; }
    @media (max-width: 600px) { .container { border-radius: 0; } .header { padding: 30px 20px; } .content { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎟️ CITY EVENT</h1>
      <p>Your ticket is confirmed!</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
        Hello <strong>${attendeeName}</strong>,
      </p>
      <p style="font-size: 15px; color: #555; margin-bottom: 20px;">
        Thank you for registering! Your ticket details are below. 
        You can also view this ticket anytime in your <a href="${frontendUrl}/my-tickets" style="color: #00f5ff;">account dashboard</a>.
      </p>

      <div class="event-details">
        <h2>${eventTitle}</h2>
        <div class="detail-row">
          <span class="detail-label">📅 Date:</span>
          <span>${eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📍 Location:</span>
          <span>${eventLocation}</span>
        </div>
      </div>

      <div class="qr-section">
        <h3 style="color: #0a0a0a; margin: 0 0 15px 0; font-size: 18px;">Your Entry Pass</h3>
        ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="Ticket QR Code" />` : '<p style="font-size: 24px;">🎫</p>'}
        <p>Present this QR code at the event entrance for check-in</p>
      </div>

      <div class="ticket-id">
        Ticket ID: <strong>${ticketId}</strong>
      </div>

      ${amountPaid > 0 ? `
        <div class="price-info">
          <div class="label">Amount Paid</div>
          <div class="amount">$${amountPaid.toFixed(2)}</div>
        </div>
      ` : `
        <div class="price-info">
          <div class="label">Free Event</div>
          <div class="amount" style="font-size: 18px;">🎉 No payment required</div>
        </div>
      `}

      <div style="text-align: center; margin-top: 20px;">
        <a href="${frontendUrl}/my-tickets" class="btn">View My Tickets</a>
      </div>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} City Event. All rights reserved.</p>
      <p>Need help? <a href="mailto:support@cityevent.com">support@cityevent.com</a></p>
      <p style="font-size: 11px; color: #aaa;">This is an automated message. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: `"City Event" <${process.env.SMTP_FROM || 'noreply@cityevent.com'}>`,
    to,
    subject: `🎟️ Your Ticket: ${eventTitle} - City Event`,
    html: emailHtml,
    attachments: [],
  };

  // Attach PDF if provided
  if (pdfAttachmentPath) {
    mailOptions.attachments.push({
      filename: `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket.pdf`,
      path: pdfAttachmentPath,
    });
  }

  try {
    const info = await mailTransport.sendMail(mailOptions);
    console.log(`✅ Ticket email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send ticket email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send an event reminder email (24h before event)
 */
export const sendEventReminder = async ({
  to,
  attendeeName,
  eventTitle,
  eventDate,
  eventLocation,
}) => {
  const mailTransport = getTransporter();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #0a0a0a;">⏰ Event Reminder</h2>
    <p>Hi <strong>${attendeeName}</strong>,</p>
    <p>Your event is happening <strong>tomorrow</strong>!</p>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3 style="margin: 0 0 10px 0; color: #0a0a0a;">${eventTitle}</h3>
      <p style="margin: 5px 0; color: #555;">📅 ${eventDate}</p>
      <p style="margin: 5px 0; color: #555;">📍 ${eventLocation}</p>
    </div>
    <p>Don't forget to bring your QR code ticket for check-in!</p>
    <a href="${frontendUrl}/my-tickets" style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #00f5ff, #8338ec); color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">View My Tickets</a>
  </div>
</body>
</html>`;

  try {
    const info = await mailTransport.sendMail({
      from: `"City Event" <${process.env.SMTP_FROM || 'noreply@cityevent.com'}>`,
      to,
      subject: `⏰ Reminder: ${eventTitle} is tomorrow!`,
      html: emailHtml,
    });
    console.log(`✅ Reminder email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send reminder email to ${to}:`, error.message);
    // Don't throw on reminder failures - non-critical
    return { success: false, error: error.message };
  }
};

export default {
  sendTicketConfirmation,
  sendEventReminder,
};