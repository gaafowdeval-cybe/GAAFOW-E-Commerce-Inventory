import { Order } from '../types';

/**
 * Automatically normalize Somali phone numbers to E.164 format:
 * - 061XXXXXXX → +25261XXXXXXX
 * - 062XXXXXXX → +25262XXXXXXX
 * - 63XXXXXXX → +25263XXXXXXX
 * - If already starts with +252, leave unchanged.
 */
export function normalizeSomaliPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  
  // strip spaces, dashes, parentheses
  let clean = rawPhone.trim().replace(/[\s()-]+/g, '');
  
  // If already starts with +252, leave unchanged
  if (clean.startsWith('+252')) {
    return clean;
  }
  
  // If starts with 252 (but no +), return with +
  if (clean.startsWith('252')) {
    return '+' + clean;
  }
  
  // If starts with 061
  if (clean.startsWith('061')) {
    return '+25261' + clean.slice(3);
  }
  
  // If starts with 062
  if (clean.startsWith('062')) {
    return '+25262' + clean.slice(3);
  }
  
  // If starts with 61 (no leading 0) and is 9 digits (61XXXXXXX)
  if (clean.startsWith('61') && clean.length === 9) {
    return '+252' + clean;
  }
  
  // If starts with 62 (no leading 0) and is 9 digits (62XXXXXXX)
  if (clean.startsWith('62') && clean.length === 9) {
    return '+252' + clean;
  }
  
  // If starts with 63 (63XXXXXXX)
  if (clean.startsWith('63')) {
    return '+252' + clean;
  }
  
  // If starts with 063 (063XXXXXXX)
  if (clean.startsWith('063')) {
    return '+25263' + clean.slice(3);
  }
  
  // If it's a generic local 7-9 digit number starting with 1, 2, 3, 4, 5, 6, 7, 8, 9
  if (clean.length >= 7 && clean.length <= 10 && !clean.startsWith('0')) {
    return '+252' + clean;
  }
  
  // If starts with 0 and has length >= 8, replace leading 0 with +252
  if (clean.startsWith('0') && clean.length >= 8) {
    return '+252' + clean.slice(1);
  }

  // Fallback
  return clean;
}

/**
 * If the customer phone number is invalid, disable the button and display "Invalid Phone Number"
 * Check that the phone contains reasonable number of digits
 */
export function isValidSomaliPhone(rawPhone: string): boolean {
  if (!rawPhone || !rawPhone.trim()) return false;
  
  const normalized = normalizeSomaliPhone(rawPhone);
  const digitsOnly = normalized.replace('+', '');
  
  // Must be digits only and length should be between 9 and 15 digits
  const isDigits = /^\d+$/.test(digitsOnly);
  return isDigits && digitsOnly.length >= 9 && digitsOnly.length <= 15;
}

/**
 * Pre-filled message with:
 * Hello {{customerName}},
 * 
 * Thank you for shopping with GAAFOW.
 * 
 * Order ID: {{orderId}}
 * 
 * Items:
 * {{items}}
 * 
 * Grand Total:
 * {{grandTotal}}
 * 
 * Payment Status:
 * {{paymentStatus}}
 * 
 * Order Status:
 * {{orderStatus}}
 * 
 * Track your order:
 * {{appUrl}}/?tab=track&orderId={{orderId}}
 * 
 * Thank you.
 */
export function generateWhatsAppMessage(order: Order, appUrl: string): string {
  const itemsText = order.items
    .map(item => `- ${item.title} (x${item.quantity})`)
    .join('\n');
    
  let paymentStatus = 'Paid / Confirmed';
  if (order.status === 'Pending Verification') {
    paymentStatus = 'Pending Verification (Reviewing Receipt)';
  } else if (order.status === 'Rejected') {
    paymentStatus = 'Rejected (Invalid Payment Receipt)';
  }
  
  return `Hello ${order.customerName},

Thank you for shopping with GAAFOW.

Order ID: ${order.id}

Items:
${itemsText}

Grand Total:
$${order.total.toFixed(2)}

Payment Status:
${paymentStatus}

Order Status:
${order.status}

Track your order:
${appUrl}/?tab=track&orderId=${order.id}

Thank you.`;
}

/**
 * Generate a WhatsApp Click-to-Chat URL
 * https://wa.me/<phone>?text=<encoded_message>
 * Phone must be digits-only without '+' or leading zeros (as required by wa.me)
 */
export function generateWhatsAppClickToChatUrl(phone: string, message: string): string {
  const normalized = normalizeSomaliPhone(phone);
  // Remove '+' and keep only numbers
  const cleanDigits = normalized.replace(/[^\d]/g, '');
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}
