export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  rating: number;
  reviewsCount: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus =
  | 'Pending Verification'
  | 'Payment Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Rejected';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethod: string;
  paymentProof?: string; // base64 data URL
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  type: 'email' | 'whatsapp';
  recipient: string;
  subject?: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'pending';
}
