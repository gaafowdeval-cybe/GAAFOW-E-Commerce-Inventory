import { useState, useEffect } from 'react';
import { Product, Order, AppNotification } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import Sidebar from './components/Sidebar';
import { Search } from 'lucide-react';
import Storefront from './components/Storefront';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderTracker from './components/OrderTracker';
import AdminPanel from './components/AdminPanel';
import NotificationToast from './components/NotificationToast';
import WhatsAppFloating from './components/WhatsAppFloating';

// High fidelity Mock receipt images as SVG Data URIs
const MOCK_RECEIPT_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" style="background-color:%230F172A;font-family:monospace;color:%2394A3B8;padding:20px;box-sizing:border-box;">
  <rect width="360" height="460" x="20" y="20" rx="15" fill="%231E293B" stroke="%23334155" stroke-width="2"/>
  <text x="200" y="70" fill="%2338BDF8" font-size="24" font-weight="bold" text-anchor="middle">ZAAD PAYMENT</text>
  <text x="200" y="100" fill="%2322C55E" font-size="14" font-weight="bold" text-anchor="middle">TRANSACTION SUCCESS</text>
  
  <line x1="40" y1="130" x2="360" y2="130" stroke="%23334155" stroke-dasharray="5 5"/>
  
  <text x="50" y="170" fill="%2394A3B8" font-size="12">MERCHANT ID:</text>
  <text x="350" y="170" fill="%23F1F5F9" font-size="12" text-anchor="end">GAAFOW ONLINE (4892211)</text>
  
  <text x="50" y="210" fill="%2394A3B8" font-size="12">REF NUMBER:</text>
  <text x="350" y="210" fill="%23F59E0B" font-size="12" font-weight="bold" text-anchor="end">TXN-9382210048</text>
  
  <text x="50" y="250" fill="%2394A3B8" font-size="12">AMOUNT SENT:</text>
  <text x="350" y="250" fill="%2338BDF8" font-size="14" font-weight="bold" text-anchor="end">$151.00 USD</text>
  
  <text x="50" y="290" fill="%2394A3B8" font-size="12">SENDER NAME:</text>
  <text x="350" y="290" fill="%23F1F5F9" font-size="12" text-anchor="end">Abdirahman Yusuf</text>

  <text x="50" y="330" fill="%2394A3B8" font-size="12">DATE &amp; TIME:</text>
  <text x="350" y="330" fill="%23F1F5F9" font-size="12" text-anchor="end">2026-07-14 09:12:44</text>
  
  <line x1="40" y1="370" x2="360" y2="370" stroke="%23334155" stroke-dasharray="5 5"/>
  
  <text x="200" y="415" fill="%2322C55E" font-size="12" font-weight="bold" text-anchor="middle">&#10004; Verified Merchant Terminal</text>
  <text x="200" y="435" fill="%2364748B" font-size="10" text-anchor="middle">Powered by Hormuud Telecom Corp</text>
</svg>`;

const MOCK_RECEIPT_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" style="background-color:%230F172A;font-family:monospace;color:%2394A3B8;padding:20px;box-sizing:border-box;">
  <rect width="360" height="460" x="20" y="20" rx="15" fill="%231E293B" stroke="%23334155" stroke-width="2"/>
  <text x="200" y="70" fill="%2338BDF8" font-size="22" font-weight="bold" text-anchor="middle">PREMIER BANK TRANSFER</text>
  <text x="200" y="100" fill="%23E2E8F0" font-size="12" text-anchor="middle">MOBILE BANKING RECEIPT</text>
  
  <line x1="40" y1="130" x2="360" y2="130" stroke="%23334155" stroke-dasharray="5 5"/>
  
  <text x="50" y="170" fill="%2394A3B8" font-size="12">BENEFICIARY:</text>
  <text x="350" y="170" fill="%23F1F5F9" font-size="12" text-anchor="end">GAAFOW ONLINE (10048220)</text>
  
  <text x="50" y="210" fill="%2394A3B8" font-size="12">REFERENCE ID:</text>
  <text x="350" y="210" fill="%23F59E0B" font-size="12" font-weight="bold" text-anchor="end">REF-SAL-839211029</text>
  
  <text x="50" y="250" fill="%2394A3B8" font-size="12">TRANSFER AMOUNT:</text>
  <text x="350" y="250" fill="%2338BDF8" font-size="14" font-weight="bold" text-anchor="end">$97.00 USD</text>
  
  <text x="50" y="290" fill="%2394A3B8" font-size="12">DEBIT FROM:</text>
  <text x="350" y="290" fill="%23F1F5F9" font-size="12" text-anchor="end">Farhiya Farah (*0921)</text>

  <text x="50" y="330" fill="%2394A3B8" font-size="12">STAMP TIME:</text>
  <text x="350" y="330" fill="%23F1F5F9" font-size="12" text-anchor="end">2026-07-14 11:30:15</text>
  
  <line x1="40" y1="370" x2="360" y2="370" stroke="%23334155" stroke-dasharray="5 5"/>
  
  <text x="200" y="415" fill="%2322C55E" font-size="12" font-weight="bold" text-anchor="middle">&#10004; Instantly Approved Clearing</text>
  <text x="200" y="435" fill="%2364748B" font-size="10" text-anchor="middle">Official E-Commerce Ingress Wallet</text>
</svg>`;

const INITIAL_ORDERS: Order[] = [
  {
    id: 'GF-1001',
    customerName: 'Abdirahman Yusuf',
    customerEmail: 'yusuf@gmail.com',
    customerPhone: '+252 61 555 0001',
    deliveryAddress: 'Hodan District, Maka Al Mukarama Rd, Mogadishu',
    deliveryNotes: 'Deliver to 3rd floor office, call on arrival',
    paymentMethod: 'Mobile Money',
    paymentProof: MOCK_RECEIPT_1,
    items: [
      {
        productId: 'prod-1',
        title: 'GAAFOW Pro Wireless Headphones',
        price: 129,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
      },
      {
        productId: 'prod-7',
        title: 'Specialty Organic Coffee Beans',
        price: 22,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80'
      }
    ],
    total: 151, // $151 (Free shipping on order > $100)
    status: 'Payment Confirmed',
    createdAt: '2026-07-14T09:12:44Z',
    updatedAt: '2026-07-14T09:25:00Z'
  },
  {
    id: 'GF-1002',
    customerName: 'Farhiya Farah',
    customerEmail: 'farhiya@gmail.com',
    customerPhone: '+252 61 555 0002',
    deliveryAddress: 'Waberi District, Bulahubey, Mogadishu',
    deliveryNotes: 'Leave with receptionist if not inside',
    paymentMethod: 'Bank Transfer',
    paymentProof: MOCK_RECEIPT_2,
    items: [
      {
        productId: 'prod-2',
        title: 'Minimalist Commuter Backpack',
        price: 65,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
      },
      {
        productId: 'prod-8',
        title: 'Organic Vitamin C Glow Serum',
        price: 32,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80'
      }
    ],
    total: 97, // $97 (Includes free shipping as total is $97, wait no, let's say total is $97 subtotal and $0 delivery as a promo, or $97 absolute)
    status: 'Pending Verification',
    createdAt: '2026-07-14T11:30:15Z',
    updatedAt: '2026-07-14T11:30:15Z'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'shop' | 'track' | 'admin'>('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCheckout, setActiveCheckout] = useState(false);

  // Core domain states backed by Local Storage
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('gaafow_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('gaafow_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    const saved = localStorage.getItem('gaafow_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [toastNotifications, setToastNotifications] = useState<AppNotification[]>([]);
  const [systemLogs, setSystemLogs] = useState<AppNotification[]>([]);

  // Synchronize Local Storage
  useEffect(() => {
    localStorage.setItem('gaafow_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('gaafow_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const orderIdParam = params.get('orderId');

    if (tabParam === 'track' || orderIdParam) {
      setActiveTab('track');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gaafow_cart', JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(product.stock, quantity) }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Trigger notification backend dispatcher
  const triggerNotification = async (
    order: Order,
    stage: 'Submitted' | 'Verified' | 'Processing' | 'Shipped' | 'Delivered'
  ) => {
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          deliveryAddress: order.deliveryAddress,
          items: order.items.map((item) => ({
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
          total: order.total,
          status: order.status,
          stage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch notification');
      }

      console.log('[NOTIFY] Real-time notification results:', data);

      if (data.results) {
        if (data.results.email) {
          addSystemNotification({
            id: `notif-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'email',
            recipient: order.customerEmail,
            subject: `Order Update [${stage}] - ${order.id}`,
            message: `[Backend SMTP] ${data.results.email.info || 'Email status updated'} (${data.results.email.status.toUpperCase()})`,
            timestamp: new Date().toISOString(),
            status: data.results.email.status === 'sent' || data.results.email.status === 'simulated' ? 'sent' : 'pending',
          });
        }
        if (data.results.whatsapp) {
          addSystemNotification({
            id: `notif-wa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'whatsapp',
            recipient: order.customerPhone,
            message: `[Backend WhatsApp] ${data.results.whatsapp.info || 'WhatsApp status updated'} (${data.results.whatsapp.status.toUpperCase()})`,
            timestamp: new Date().toISOString(),
            status: data.results.whatsapp.status === 'sent' || data.results.whatsapp.status === 'simulated' ? 'sent' : 'pending',
          });
        }
      }
    } catch (error: any) {
      console.error('[NOTIFY] Frontend notification trigger failure:', error);
      addSystemNotification({
        id: `notif-err-${Date.now()}`,
        type: 'email',
        recipient: order.customerEmail,
        subject: 'Notification Error',
        message: `Error sending notification: ${error.message}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      });
    }
  };

  // Place Order Action from Checkout Page
  const handlePlaceOrder = (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryNotes?: string;
    paymentMethod: string;
    paymentProof: string;
  }) => {
    const newOrderId = `GF-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const deliveryFee = subtotal > 100 ? 0 : 10;
    const grandTotal = subtotal + deliveryFee;

    const newOrder: Order = {
      id: newOrderId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.deliveryAddress,
      deliveryNotes: orderData.deliveryNotes,
      paymentMethod: orderData.paymentMethod,
      paymentProof: orderData.paymentProof,
      items: cart.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
      })),
      total: grandTotal,
      status: 'Pending Verification',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update orders list
    setOrders((prev) => [newOrder, ...prev]);
    
    // Clear cart
    setCart([]);

    // Trigger automated notification simulations
    const newNotifEmail: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'email',
      recipient: orderData.customerEmail,
      subject: `Order Submitted - GAAFOW ${newOrderId}`,
      message: `Dear ${orderData.customerName}, your GAAFOW order ${newOrderId} of $${grandTotal} has been submitted! Our staff is currently verifying your payment screenshot.`,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
    const newNotifWhatsApp: AppNotification = {
      id: `notif-${Date.now() + 1}`,
      type: 'whatsapp',
      recipient: orderData.customerPhone,
      message: `GAAFOW: Thank you for your order ${newOrderId}! Tracking Link: https://gaafow.com/track?id=${newOrderId}`,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    addSystemNotification(newNotifEmail);
    addSystemNotification(newNotifWhatsApp);

    // Call the backend API trigger in a non-blocking manner
    triggerNotification(newOrder, 'Submitted');

    return newOrderId;
  };

  const addSystemNotification = (notif: AppNotification) => {
    setToastNotifications((prev) => [...prev, notif]);
    setSystemLogs((prev) => [notif, ...prev]);
  };

  const handleRemoveToast = (id: string) => {
    setToastNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveCheckout(false); // reset checkout state when changing tabs
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        toggleCart={() => setIsCartOpen(!isCartOpen)}
      />

      {/* Content wrapper taking remaining space */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Dynamic header inside the content wrapper for search & title */}
        <div className="bg-white border-b border-slate-200/85 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 capitalize tracking-tight flex items-center gap-2">
              {activeCheckout ? 'Checkout Details' : activeTab === 'shop' ? 'GAAFOW Storefront' : activeTab === 'track' ? 'Track Your Order' : 'Admin Panel'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {activeCheckout ? 'Securely place your cash-on-delivery or manual transfer order.' : activeTab === 'shop' ? 'Premium items available for prompt delivery in Mogadishu.' : activeTab === 'track' ? 'Real-time dispatch, ZAAD verify status, and shipment log.' : 'Verify transactions, update stocks, and dispatch SMS/WhatsApp alerts.'}
            </p>
          </div>

          {/* Search bar inside header when on Shop view */}
          {!activeCheckout && activeTab === 'shop' && (
            <div className="relative w-full sm:max-w-xs shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="content-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 text-slate-900 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-50/50 p-6 pb-20">
          {activeCheckout ? (
            /* Render Checkout Screen */
            <Checkout
              cartItems={cart}
              onPlaceOrder={handlePlaceOrder}
              onCancel={() => setActiveCheckout(false)}
            />
          ) : activeTab === 'shop' ? (
            /* Render Shop Screen */
            <Storefront
              products={products}
              searchQuery={searchQuery}
              onAddToCart={handleAddToCart}
            />
          ) : activeTab === 'track' ? (
            /* Render Tracking Screen */
            <OrderTracker orders={orders} />
          ) : (
            /* Render Admin Panel */
            <AdminPanel
              products={products}
              onUpdateProducts={setProducts}
              orders={orders}
              onUpdateOrders={setOrders}
              notifications={systemLogs}
              onAddNotification={addSystemNotification}
              onTriggerNotification={triggerNotification}
            />
          )}
        </main>

        {/* Footer Branding */}
        <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-500 text-xs mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="font-extrabold text-sm text-slate-300 tracking-wider block sm:inline">GAAFOW </span>
              <span className="text-[11px]">— Everything You Need, Delivered Fast.</span>
            </div>
            <p>© 2026 GAAFOW. All Rights Reserved.</p>
          </div>
        </footer>
      </div>

      {/* Cart Drawer */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setActiveCheckout(true);
          setIsCartOpen(false);
        }}
      />

      {/* Floaters & Alerts */}
      <WhatsAppFloating />
      
      <NotificationToast
        notifications={toastNotifications}
        onRemove={handleRemoveToast}
      />

    </div>
  );
}
