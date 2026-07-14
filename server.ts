import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Parse incoming JSON payloads
app.use(express.json());

// Type interfaces for validation & formatting
interface NotifyPayload {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  items: { title: string; price: number; quantity: number }[];
  total: number;
  status: string;
  stage: 'Submitted' | 'Verified' | 'Processing' | 'Shipped' | 'Delivered';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/; // general E.164 phone validation (7 to 15 digits)

// Exponential backoff helper for retrying network operations
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) {
      throw error;
    }
    console.warn(`[RETRY] Action failed, retrying in ${delay}ms... Error:`, (error as Error).message);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

// Format WhatsApp message with required order details
function formatWhatsAppMessage(payload: NotifyPayload, trackingLink: string): string {
  const { customerName, orderId, total, stage, items } = payload;
  const itemsSummary = items.map(i => `${i.title} (x${i.quantity})`).join(', ');

  switch (stage) {
    case 'Submitted':
      return `GAAFOW E-Commerce: Hello ${customerName}! 🌟\n\nYour Order *${orderId}* has been submitted successfully.\n\n*Summary:* ${itemsSummary}\n*Total Amount:* $${total.toFixed(2)} USD\n*Status:* Pending Verification (Payment Review)\n\nTrack your order in real-time here:\n👉 ${trackingLink}\n\nThank you for shopping with GAAFOW!`;
    case 'Verified':
      return `GAAFOW E-Commerce: Hello ${customerName}! ✅\n\nGreat news! Your payment for Order *${orderId}* has been verified (Payment Review completed).\n\n*Status:* Stock Allocation (Processing)\n\nTrack progress here:\n👉 ${trackingLink}`;
    case 'Processing':
      return `GAAFOW E-Commerce: Hello ${customerName}! 📦\n\nOrder *${orderId}* status updated!\n\n*Stage:* Stock Allocation Completed (Processing)\n\nWe are packaging your items. Track here:\n👉 ${trackingLink}`;
    case 'Shipped':
      return `GAAFOW E-Commerce: Hello ${customerName}! 🚚\n\nYour Order *${orderId}* is out for dispatch!\n\n*Status:* Out for Dispatch\n*Delivery Address:* ${payload.deliveryAddress}\n\nOur delivery agent is on their way. Track delivery here:\n👉 ${trackingLink}`;
    case 'Delivered':
      return `GAAFOW E-Commerce: Hello ${customerName}! 🎉\n\nYour Order *${orderId}* has been successfully delivered!\n\n*Status:* Completed\n\nWe hope you love your purchase! Feel free to leave a review.\n👉 ${trackingLink}`;
    default:
      return `GAAFOW E-Commerce: Hello ${customerName}! Your Order *${orderId}* status is currently: ${stage}.\nTrack here:\n👉 ${trackingLink}`;
  }
}

// Format styled HTML email message
function formatEmailHtml(payload: NotifyPayload, trackingLink: string): string {
  const { customerName, orderId, total, stage, items, deliveryAddress } = payload;
  const itemsHtml = items.map(i => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 0; color: #334155;">${i.title}</td>
      <td style="padding: 12px 0; text-align: center; color: #475569;">x${i.quantity}</td>
      <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: bold;">$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  let statusTitle = '';
  let statusDescription = '';
  let statusBadgeColor = '#f59e0b';

  switch (stage) {
    case 'Submitted':
      statusTitle = 'Order Submitted successfully!';
      statusDescription = 'Thank you for your purchase! We have received your order details and payment screenshot. Our finance team is currently reviewing your payment proof.';
      statusBadgeColor = '#f59e0b'; // amber
      break;
    case 'Verified':
      statusTitle = 'Payment Verified!';
      statusDescription = 'Excellent! Your payment receipt has been successfully approved by our team. We are now allocating stocks from our central Mogadishu inventory.';
      statusBadgeColor = '#10b981'; // emerald
      break;
    case 'Processing':
      statusTitle = 'Stock Allocated & Processing!';
      statusDescription = 'Your order is currently in the processing queue. We have secured your items and are packing them carefully for delivery.';
      statusBadgeColor = '#06b6d4'; // cyan
      break;
    case 'Shipped':
      statusTitle = 'Out for Dispatch!';
      statusDescription = `Your parcel is on its way to your address: <strong>${deliveryAddress}</strong>. Our local courier will call you on arrival.`;
      statusBadgeColor = '#3b82f6'; // blue
      break;
    case 'Delivered':
      statusTitle = 'Delivered & Completed!';
      statusDescription = 'Your GAAFOW order has been successfully delivered and handed over. Enjoy your new products!';
      statusBadgeColor = '#10b981'; // emerald
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>GAAFOW Order Notification</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">GAAFOW</h1>
          <p style="margin: 4px 0 0; font-size: 14px; color: #94a3b8;">Everything You Need, Delivered Fast</p>
        </div>
        
        <!-- Body Content -->
        <div style="padding: 32px 24px;">
          <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Dear <strong>${customerName}</strong>,</p>
          
          <!-- Status callout -->
          <div style="background-color: #f8fafc; border-left: 4px solid ${statusBadgeColor}; padding: 16px; border-radius: 0 12px 12px 0; margin: 24px 0;">
            <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${statusTitle}</h3>
            <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.5;">${statusDescription}</p>
          </div>
          
          <!-- Details Grid -->
          <div style="margin: 24px 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Order ID:</strong> <span style="font-family: monospace; font-size: 14px; color: #0f172a; font-weight: bold;">${orderId}</span></p>
            <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Delivery To:</strong> ${deliveryAddress}</p>
          </div>

          <!-- Items Table -->
          <h4 style="margin: 24px 0 8px; color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Order Summary</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; color: #475569;">
                <th style="padding-bottom: 8px;">Item</th>
                <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                <th style="padding-bottom: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding: 16px 0 0; font-weight: bold; color: #475569; font-size: 14px;">Grand Total Paid:</td>
                <td style="padding: 16px 0 0; text-align: right; font-weight: 800; color: #0f172a; font-size: 18px;">$${total.toFixed(2)} USD</td>
              </tr>
            </tbody>
          </table>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 36px 0 12px;">
            <a href="${trackingLink}" target="_blank" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: bold; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.25);">
              Track Your Order Progress Live
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 4px 0;">This is an automated notification from GAAFOW E-Commerce Platform.</p>
          <p style="margin: 0;">Mogadishu, Somalia. Support WhatsApp: +252 617624424</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Low-level function to send Email (SMTP)
async function sendEmailNotification(payload: NotifyPayload, trackingLink: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'GAAFOW <no-reply@gaafow.com>';

  if (!host || !user || !pass) {
    console.warn('[EMAIL] SMTP details are not fully configured in environment variables. Simulating dispatch.');
    return {
      status: 'simulated',
      info: 'SMTP credentials missing. Simulated dispatch successful.'
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  const html = formatEmailHtml(payload, trackingLink);
  const mailOptions = {
    from,
    to: payload.customerEmail,
    subject: `[GAAFOW] Order ${payload.orderId} - Stage Update: ${payload.stage}`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('[EMAIL] Email dispatched successfully:', info.messageId);
  return {
    status: 'sent',
    info: `Email dispatched successfully (ID: ${info.messageId})`
  };
}

// Low-level function to send WhatsApp (Twilio or Meta Business)
async function sendWhatsAppNotification(payload: NotifyPayload, trackingLink: string) {
  const message = formatWhatsAppMessage(payload, trackingLink);
  const recipient = payload.customerPhone;

  // Twilio Settings
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

  // Meta Cloud API Settings
  const metaToken = process.env.META_WA_ACCESS_TOKEN;
  const metaPhoneId = process.env.META_WA_PHONE_NUMBER_ID;

  if (twilioSid && twilioToken) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
    
    // Twilio recipient and sender must start with 'whatsapp:'
    const twilioTo = recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${recipient}`;
    const twilioFromFormatted = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;

    const params = new URLSearchParams();
    params.append('To', twilioTo);
    params.append('From', twilioFromFormatted);
    params.append('Body', message);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const responseText = await response.text();
        
        // Detect 429 status, limit exceeded messages, or specific Twilio rate codes
        if (
          response.status === 429 ||
          responseText.includes('exceeded') ||
          responseText.includes('limit') ||
          responseText.includes('63038') ||
          responseText.includes('trial')
        ) {
          console.warn('[WHATSAPP] Twilio limits reached. Gracefully falling back to simulated dispatch status.');
          return {
            status: 'simulated',
            info: `[Trial Limit Fallback] Outbound message rate limit reached. Simulated dispatch completed.`
          };
        }
        
        throw new Error(`Twilio API rejected request: ${response.status} - ${responseText}`);
      }

      const data = await response.json();
      console.log('[WHATSAPP] Twilio message dispatched successfully:', (data as any).sid);
      return {
        status: 'sent',
        provider: 'twilio',
        info: `Dispatched via Twilio WhatsApp (SID: ${(data as any).sid})`
      };
    } catch (err: any) {
      // Check if error itself represents rate limits or quota issues
      if (
        err.message.includes('429') ||
        err.message.includes('exceeded') ||
        err.message.includes('limit') ||
        err.message.includes('63038')
      ) {
        console.warn('[WHATSAPP] Caught Twilio limit error in catch block. Falling back to simulated.');
        return {
          status: 'simulated',
          info: `[Trial Limit Fallback] Rate limit reached. Simulated dispatch completed.`
        };
      }
      throw err;
    }
  } else if (metaToken && metaPhoneId) {
    const url = `https://graph.facebook.com/v17.0/${metaPhoneId}/messages`;
    // Meta expects clean numeric phone number format
    const cleanRecipient = recipient.replace('whatsapp:', '').replace(/[\s()-]+/g, '');

    const body = {
      messaging_product: "whatsapp",
      to: cleanRecipient,
      type: "text",
      text: { body: message }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const responseText = await response.text();
        
        if (
          response.status === 429 ||
          responseText.includes('limit') ||
          responseText.includes('quota') ||
          responseText.includes('exceeded')
        ) {
          console.warn('[WHATSAPP] Meta limits reached. Gracefully falling back to simulated dispatch status.');
          return {
            status: 'simulated',
            info: `[Meta Limit Fallback] Outbound message rate limit reached. Simulated dispatch completed.`
          };
        }

        throw new Error(`Meta Cloud API rejected request: ${response.status} - ${responseText}`);
      }

      const data = await response.json();
      console.log('[WHATSAPP] Meta Cloud message dispatched successfully:', (data as any).messages?.[0]?.id);
      return {
        status: 'sent',
        provider: 'meta',
        info: `Dispatched via Meta Cloud API (ID: ${(data as any).messages?.[0]?.id})`
      };
    } catch (err: any) {
      if (
        err.message.includes('429') ||
        err.message.includes('limit') ||
        err.message.includes('quota') ||
        err.message.includes('exceeded')
      ) {
        console.warn('[WHATSAPP] Caught Meta limit error in catch block. Falling back to simulated.');
        return {
          status: 'simulated',
          info: `[Meta Limit Fallback] Rate limit reached. Simulated dispatch completed.`
        };
      }
      throw err;
    }
  } else {
    console.warn('[WHATSAPP] WhatsApp API credentials missing. Simulating dispatch.');
    return {
      status: 'simulated',
      info: 'WhatsApp credentials missing. Simulated dispatch successful.'
    };
  }
}

// POST API Endpoint for non-blocking notification dispatch
app.post('/api/notify', async (req, res) => {
  try {
    const payload = req.body as NotifyPayload;
    const { customerName, customerEmail, customerPhone, orderId, total, stage, items } = payload;

    // 1. Strict Validation of fields
    if (!customerName || !customerEmail || !customerPhone || !orderId || !total || !stage || !items) {
      return res.status(400).json({ error: 'Missing required notify fields' });
    }

    // 2. Strict format validations
    let normalizedPhone = customerPhone.trim().replace(/[\s()-]+/g, '');
    
    // Normalize Somali numbers to international standard (+252...)
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+252' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('252') && !normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (!normalizedPhone.startsWith('+') && normalizedPhone.length >= 7 && normalizedPhone.length <= 10) {
      normalizedPhone = '+252' + normalizedPhone;
    }

    // Overwrite the payload's customerPhone with normalized format for sending
    payload.customerPhone = normalizedPhone;

    const isEmailValid = EMAIL_REGEX.test(customerEmail);
    const isPhoneValid = PHONE_REGEX.test(normalizedPhone);

    if (!isEmailValid) {
      return res.status(400).json({ error: `Invalid email address format: "${customerEmail}"` });
    }

    if (!isPhoneValid) {
      return res.status(400).json({ error: `Invalid phone number format: "${customerPhone}". Must be in international format (e.g., +252XXXXXXXXX).` });
    }

    // Prepare self-referential tracking link using automatic APP_URL or localhost default
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const trackingLink = `${appUrl}/?tab=track&orderId=${orderId}`;

    console.log(`[NOTIFY] Initiating notifications for Order: ${orderId} | Customer: ${customerName} | Stage: ${stage}`);

    // 3. Dispatch Email & WhatsApp in a non-blocking background queue with retry logic
    const results = {
      whatsapp: { status: 'pending', info: '' },
      email: { status: 'pending', info: '' }
    };

    // Execute triggers with retry logic (up to 3 attempts)
    const waPromise = retryWithBackoff(() => sendWhatsAppNotification(payload, trackingLink), 3, 1000)
      .then(res => {
        results.whatsapp = { status: res.status, info: res.info };
      })
      .catch(err => {
        console.error('[WHATSAPP] Failed to send WhatsApp message after 3 attempts:', err.message);
        results.whatsapp = { status: 'failed', info: `WhatsApp send failed: ${err.message}` };
      });

    const emailPromise = retryWithBackoff(() => sendEmailNotification(payload, trackingLink), 3, 1000)
      .then(res => {
        results.email = { status: res.status, info: res.info };
      })
      .catch(err => {
        console.error('[EMAIL] Failed to send email after 3 attempts:', err.message);
        results.email = { status: 'failed', info: `Email send failed: ${err.message}` };
      });

    // Wait for dispatch attempts before returning results to client (allows log aggregation)
    await Promise.all([waPromise, emailPromise]);

    return res.json({
      success: true,
      orderId,
      stage,
      dispatchedAt: new Date().toISOString(),
      results
    });

  } catch (error: any) {
    console.error('[NOTIFY] Internal error processing notification triggers:', error.message);
    return res.status(500).json({ error: 'Internal server error processing notification triggers' });
  }
});

// App health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start server and handle Vite development vs production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Full-stack GAAFOW server running on port ${PORT}`);
  });
}

startServer();
