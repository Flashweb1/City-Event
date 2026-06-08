import puppeteer from 'puppeteer';

/**
 * Generate a PDF ticket with event details and QR code
 * @param {Object} params
 * @param {string} params.attendeeName - Full name of attendee
 * @param {string} params.eventTitle - Event name
 * @param {string} params.eventDate - Formatted event date/time
 * @param {string} params.eventLocation - Event location
 * @param {string} params.qrCodeDataUrl - Base64 data URL of QR code image
 * @param {string} params.ticketId - Unique ticket ID
 * @param {number} params.amountPaid - Amount paid
 * @returns {Promise<Buffer>} PDF file buffer
 */
export const generateTicketPdf = async ({
  attendeeName,
  eventTitle,
  eventDate,
  eventLocation,
  qrCodeDataUrl,
  ticketId,
  amountPaid = 0,
}) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 0; padding: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; }
    
    .ticket {
      max-width: 700px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 30px rgba(0,0,0,0.15);
    }
    
    .header {
      background: linear-gradient(135deg, #00f5ff, #8338ec);
      padding: 40px;
      text-align: center;
      position: relative;
    }
    
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 30px;
      background: linear-gradient(to bottom right, transparent 49%, #ffffff 50%);
    }
    
    .header h1 {
      color: #ffffff;
      font-size: 32px;
      text-transform: uppercase;
      letter-spacing: 3px;
      font-weight: 800;
    }
    
    .header .subtitle {
      color: rgba(255,255,255,0.9);
      font-size: 16px;
      margin-top: 8px;
    }
    
    .content { padding: 40px; }
    
    .attendee-name {
      text-align: center;
      font-size: 24px;
      font-weight: 800;
      color: #0a0a0a;
      margin-bottom: 30px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .event-title-section {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .event-title-section h2 {
      font-size: 28px;
      color: #0a0a0a;
      margin-bottom: 10px;
    }
    
    .details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 30px;
      padding: 0 20px;
    }
    
    .detail-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .detail-row:last-child { border-bottom: none; }
    
    .detail-icon { font-size: 20px; margin-right: 15px; }
    .detail-label { font-weight: 600; color: #333; min-width: 100px; font-size: 14px; }
    .detail-value { color: #555; font-size: 15px; }
    
    .qr-section {
      text-align: center;
      padding: 30px;
      background: #f8f9fa;
      border-radius: 12px;
      margin: 20px 0;
    }
    
    .qr-section img {
      width: 200px;
      height: 200px;
    }
    
    .qr-section p {
      color: #888;
      font-size: 13px;
      margin-top: 10px;
    }
    
    .ticket-id-section {
      text-align: center;
      padding: 15px;
      font-size: 13px;
      color: #888;
    }
    
    .ticket-id-section strong {
      color: #0a0a0a;
      letter-spacing: 1px;
    }
    
    .price-section {
      text-align: center;
      padding: 15px;
      background: linear-gradient(135deg, rgba(0,245,255,0.1), rgba(131,56,236,0.1));
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .price-amount { font-size: 22px; font-weight: 800; color: #0a0a0a; }
    .price-label { font-size: 12px; color: #666; margin-top: 4px; }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: #888;
      font-size: 11px;
      border-top: 1px solid #eee;
    }
    
    .tear-line {
      position: relative;
      height: 20px;
      background: #f4f4f4;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .tear-line::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 2px;
      background: repeating-linear-gradient(
        90deg,
        transparent,
        transparent 10px,
        #ddd 10px,
        #ddd 12px
      );
    }
    
    .cut-line {
      text-align: center;
      padding: 5px;
      color: #bbb;
      font-size: 10px;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>🎟️ CITY EVENT</h1>
      <div class="subtitle">Official Ticket • Entry Pass</div>
    </div>
    
    <div class="content">
      <div class="event-title-section">
        <h2>${eventTitle}</h2>
      </div>
      
      <div class="attendee-name">
        ${attendeeName}
      </div>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📍</span>
          <span class="detail-label">Location</span>
          <span class="detail-value">${eventLocation}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">🎫</span>
          <span class="detail-label">Ticket Type</span>
          <span class="detail-value">${amountPaid > 0 ? 'Paid Entry' : 'Free Entry'}</span>
        </div>
      </div>
      
      <div class="qr-section">
        <h3 style="color: #0a0a0a; margin-bottom: 15px; font-size: 18px;">Entry Pass</h3>
        ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" />` : '<p>🎫</p>'}
        <p>Present this QR code at the venue entrance</p>
      </div>
      
      <div class="ticket-id-section">
        Ticket ID: <strong>${ticketId}</strong>
      </div>
      
      ${amountPaid > 0 ? `
        <div class="price-section">
          <div class="price-label">Amount Paid</div>
          <div class="price-amount">$${amountPaid.toFixed(2)}</div>
        </div>
      ` : `
        <div class="price-section">
          <div class="price-label">Free Event</div>
          <div class="price-amount">🎉 Complimentary</div>
        </div>
      `}
    </div>
    
    <div class="tear-line"></div>
    <div class="cut-line">- - - - - TICKET STUB - - - - -</div>
    <div class="tear-line"></div>
    
    <div style="padding: 20px; text-align: center; background: #fafafa;">
      <p style="font-size: 14px; color: #0a0a0a; font-weight: 600;">${eventTitle}</p>
      <p style="font-size: 12px; color: #888;">${attendeeName} • ${eventDate}</p>
      <p style="font-size: 11px; color: #888;">ID: ${ticketId.substring(0, 8).toUpperCase()}</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} City Event • This is your official ticket</p>
      <p>Terms & Conditions apply • Valid ID may be required</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      printBackground: true,
      displayHeaderFooter: false,
    });
    
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    // Fallback: if Puppeteer is not available, return null
    // The system will still work — just without PDF attachment
    if (error.message.includes('Failed to launch browser') || error.message.includes('ENOENT')) {
      console.warn('⚠️ Puppeteer browser not found. PDF generation skipped. Install chromium or set PUPPETEER_SKIP_DOWNLOAD=false');
      return null;
    }
    throw error;
  }
};

export default { generateTicketPdf };