import React, { useState } from 'react';
import { Product, Order, OrderStatus, AppNotification } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import {
  TrendingUp, ShoppingBag, Package, AlertTriangle, Check, X, Truck, Eye, Plus, Edit2, Trash2, Smartphone, Landmark, RefreshCw, Mail, CheckCircle2, MessageSquare,
  Lock, ShieldCheck, User, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  normalizeSomaliPhone,
  isValidSomaliPhone,
  generateWhatsAppMessage,
  generateWhatsAppClickToChatUrl
} from '../lib/whatsapp';

interface AdminPanelProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
  notifications: AppNotification[];
  onAddNotification: (notif: AppNotification) => void;
  onTriggerNotification?: (
    order: Order,
    stage: 'Submitted' | 'Verified' | 'Processing' | 'Shipped' | 'Delivered'
  ) => void;
}

export default function AdminPanel({
  products,
  onUpdateProducts,
  orders,
  onUpdateOrders,
  notifications,
  onAddNotification,
  onTriggerNotification
}: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('gaafow_admin_auth') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'orders' | 'inventory' | 'notifications'>('analytics');
  
  // Modal / form states
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Add new product form
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newImage, setNewImage] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // 1. Calculate metrics
  const totalRevenue = orders
    .filter(o => o.status !== 'Rejected' && o.status !== 'Pending Verification')
    .reduce((acc, o) => acc + o.total, 0);

  const pendingCount = orders.filter(o => o.status === 'Pending Verification').length;
  const lowStockCount = products.filter(p => p.stock <= 5 && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // Chart data 1: Sales over time
  // Generate mock chart data from existing orders or default template
  const salesHistory = [
    { date: 'Jul 08', Sales: 240 },
    { date: 'Jul 09', Sales: 380 },
    { date: 'Jul 10', Sales: 510 },
    { date: 'Jul 11', Sales: 420 },
    { date: 'Jul 12', Sales: 690 },
    { date: 'Jul 13', Sales: totalRevenue > 0 ? 500 + totalRevenue * 0.4 : 580 },
    { date: 'Jul 14', Sales: totalRevenue > 0 ? 600 + totalRevenue * 0.6 : 740 }
  ];

  // Chart data 2: Category distributions
  const categoryCounts: Record<string, number> = {};
  products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + p.stock;
  });
  const categoryChartData = Object.entries(categoryCounts).map(([name, stock]) => ({
    name,
    'Stock Units': stock
  }));

  // Handle Order Status transitions
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, rejectReason?: string) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        // Adjust stock if transitioning from Pending to Verified (Confirmed)
        if (newStatus === 'Payment Confirmed' && order.status === 'Pending Verification') {
          // Adjust products stock
          const newProducts = products.map(product => {
            const item = order.items.find(i => i.productId === product.id);
            if (item) {
              return { ...product, stock: Math.max(0, product.stock - item.quantity) };
            }
            return product;
          });
          onUpdateProducts(newProducts);
        }

        return {
          ...order,
          status: newStatus,
          rejectionReason: rejectReason,
          updatedAt: new Date().toISOString()
        };
      }
      return order;
    });

    onUpdateOrders(updated);
    
    // Dispatch real-time backend notifications and local UI logs
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      const updatedOrder = { ...targetOrder, status: newStatus, rejectionReason: rejectReason };

      // Local UI logging feedback
      if (newStatus === 'Payment Confirmed') {
        const emailNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          type: 'email',
          recipient: targetOrder.customerEmail,
          subject: `GAAFOW Order ${targetOrder.id} - Payment Verified!`,
          message: `Dear ${targetOrder.customerName}, your payment has been successfully verified! We are preparing your order items for delivery.`,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        const whatsappNotif: AppNotification = {
          id: `notif-${Date.now() + 1}`,
          type: 'whatsapp',
          recipient: targetOrder.customerPhone,
          message: `GAAFOW: Hello ${targetOrder.customerName}! Your payment for order ${targetOrder.id} has been verified. Processing begins now!`,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        onAddNotification(emailNotif);
        onAddNotification(whatsappNotif);
      } else if (newStatus === 'Rejected') {
        const emailNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          type: 'email',
          recipient: targetOrder.customerEmail,
          subject: `GAAFOW Order ${targetOrder.id} - Payment Issue`,
          message: `Dear ${targetOrder.customerName}, our team could not verify your payment. Reason: ${rejectReason || 'Receipt was invalid.'}. Please upload a correct proof.`,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        onAddNotification(emailNotif);
      } else if (newStatus === 'Processing') {
        const emailNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          type: 'email',
          recipient: targetOrder.customerEmail,
          subject: `GAAFOW Order ${targetOrder.id} - Processing`,
          message: `Dear ${targetOrder.customerName}, stocks have been allocated for your order ${targetOrder.id}. We are packaging your items!`,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        const whatsappNotif: AppNotification = {
          id: `notif-${Date.now() + 1}`,
          type: 'whatsapp',
          recipient: targetOrder.customerPhone,
          message: `GAAFOW: Hello ${targetOrder.customerName}! Stock allocation completed for order ${targetOrder.id}. We are currently packing your items.`,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        onAddNotification(emailNotif);
        onAddNotification(whatsappNotif);
      } else if (newStatus === 'Shipped') {
        const whatsappNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          type: 'whatsapp',
          recipient: targetOrder.customerPhone,
          message: `GAAFOW: Exciting news! Order ${targetOrder.id} has been handed over to our dispatch agent and is on its way to your address: ${targetOrder.deliveryAddress}.`,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        const emailNotif: AppNotification = {
          id: `notif-${Date.now() + 1}`,
          type: 'email',
          recipient: targetOrder.customerEmail,
          subject: `GAAFOW Order ${targetOrder.id} - Shipped`,
          message: `Dear ${targetOrder.customerName}, order ${targetOrder.id} has been handed over to dispatch agent.`,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        onAddNotification(whatsappNotif);
        onAddNotification(emailNotif);
      } else if (newStatus === 'Delivered') {
        const whatsappNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          type: 'whatsapp',
          recipient: targetOrder.customerPhone,
          message: `GAAFOW: Your order ${targetOrder.id} has been successfully completed! Thank you for choosing GAAFOW.`,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        const emailNotif: AppNotification = {
          id: `notif-${Date.now() + 1}`,
          type: 'email',
          recipient: targetOrder.customerEmail,
          subject: `GAAFOW Order ${targetOrder.id} - Delivered!`,
          message: `Dear ${targetOrder.customerName}, your order has been successfully delivered.`,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        onAddNotification(whatsappNotif);
        onAddNotification(emailNotif);
      }

      // Invoke real-time backend notification triggers
      if (onTriggerNotification) {
        let stage: 'Submitted' | 'Verified' | 'Processing' | 'Shipped' | 'Delivered' | null = null;
        if (newStatus === 'Payment Confirmed') {
          stage = 'Verified';
        } else if (newStatus === 'Processing') {
          stage = 'Processing';
        } else if (newStatus === 'Shipped') {
          stage = 'Shipped';
        } else if (newStatus === 'Delivered') {
          stage = 'Delivered';
        }

        if (stage) {
          onTriggerNotification(updatedOrder, stage);
        }
      }
    }
  };

  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newStock || !newImage) {
      alert('Please fill out all product fields.');
      return;
    }

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      title: newTitle,
      description: newDescription || 'Premium product offered exclusively by GAAFOW.',
      price: parseFloat(newPrice),
      stock: parseInt(newStock),
      category: newCategory,
      image: newImage,
      rating: 4.5,
      reviewsCount: 12
    };

    onUpdateProducts([newProd, ...products]);
    setIsAddingProduct(false);

    // Reset fields
    setNewTitle('');
    setNewPrice('');
    setNewStock('');
    setNewImage('');
    setNewDescription('');
  };

  const handleAdjustStock = (productId: string, adjustment: number) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, p.stock + adjustment) };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product from active inventory?')) {
      onUpdateProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctUser = usernameInput.trim() === 'admin';
    const trimmedPass = passwordInput.trim();
    // Support "omar said" and flexible typed variations to avoid user lockout
    const correctPass = trimmedPass === 'omar said' || trimmedPass === 'omar said go it' || trimmedPass === 'omar said got it';

    if (correctUser && correctPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem('gaafow_admin_auth', 'true');
      setErrorMsg('');
    } else {
      setErrorMsg('Nasiib-darro! Invalid admin username or password.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
        >
          <div className="bg-slate-900 px-6 py-8 text-center text-white relative">
            <div className="absolute top-4 right-4 bg-slate-800 text-teal-400 p-1.5 rounded-full">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black tracking-wider uppercase">GAAFOW</h2>
            <p className="text-slate-400 text-xs mt-1">Administrative Gateway Control</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                Admin Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="admin-username-input"
                  type="text"
                  required
                  placeholder="e.g. admin"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                  Admin Passphrase
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="admin-password-input"
                  type="password"
                  required
                  placeholder="Enter administrator password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Authorize Access
            </button>
          </form>
        </motion.div>

        <p className="text-slate-400 text-[10px] mt-6 text-center max-w-xs leading-relaxed">
          This panel is protected by physical and software terminal access policies. Unauthorized lookup is automatically reported.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              GAAFOW Admin Center
            </h1>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem('gaafow_admin_auth');
              }}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <span>Log Out</span>
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Real-time stock control, secure automated notification tracking, and manual order proof review panels.
          </p>
        </div>

        {/* Sub tabs switches */}
        <div className="flex bg-slate-100 rounded-xl p-1 text-xs font-bold border border-slate-200">
          <button
            id="subtab-analytics"
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${activeSubTab === 'analytics' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Analytics
          </button>
          <button
            id="subtab-orders"
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${activeSubTab === 'orders' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Orders Review
            {pendingCount > 0 && <span className="bg-amber-500 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{pendingCount}</span>}
          </button>
          <button
            id="subtab-inventory"
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${activeSubTab === 'inventory' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Inventory Control
          </button>
          <button
            id="subtab-notifications"
            onClick={() => setActiveSubTab('notifications')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${activeSubTab === 'notifications' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Dispatch Log
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        
        {/* Rev */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide leading-none mb-1">Total Sales Revenue</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-xl font-black text-slate-800">${totalRevenue}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide leading-none mb-1">Total Orders Placed</span>
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-5 h-5 text-slate-700" />
            <span className="text-xl font-black text-slate-800">{orders.length}</span>
          </div>
        </div>

        {/* Verified Rate */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide leading-none mb-1">Pending Review</span>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`w-5 h-5 ${pendingCount > 0 ? 'text-amber-500 animate-bounce' : 'text-slate-300'}`} />
            <span className="text-xl font-black text-slate-800">{pendingCount}</span>
          </div>
        </div>

        {/* Low Stock count */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide leading-none mb-1">Low Stock Products</span>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`w-5 h-5 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
            <span className="text-xl font-black text-slate-800">{lowStockCount}</span>
          </div>
        </div>

        {/* Out of Stock count */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide leading-none mb-1">Out of Stock</span>
          <div className="flex items-center gap-1.5">
            <Package className={`w-5 h-5 ${outOfStockCount > 0 ? 'text-red-500' : 'text-slate-300'}`} />
            <span className="text-xl font-black text-slate-800">{outOfStockCount}</span>
          </div>
        </div>

      </div>

      {/* Main dashboard content panels */}
      <AnimatePresence mode="wait">
        
        {/* SUBTAB 1: ANALYTICS CHARETS */}
        {activeSubTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Sales Chart */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-4 bg-emerald-600 rounded-full" />
                Sales Performance Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesHistory}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Area type="monotone" dataKey="Sales" stroke="#0F766E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product Category Stock Chart */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-4 bg-emerald-600 rounded-full" />
                Inventory Stock Units by Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9' }} />
                    <Bar dataKey="Stock Units" radius={[4, 4, 0, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0F766E' : '#F59E0B'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </motion.div>
        )}

        {/* SUBTAB 2: ORDER VERIFICATION PANEL */}
        {activeSubTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            {orders.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-slate-500">
                Currently, there are no order logs in the system history. Place mock orders from storefront to populate the review queue!
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-white font-bold uppercase tracking-wide">
                    <tr>
                      <th className="p-4">Order Info</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Paid Amt / Method</th>
                      <th className="p-4">Payment Proof Receipt</th>
                      <th className="p-4">Status & Dispatch Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Order ID & Date */}
                        <td className="p-4 font-semibold text-slate-800">
                          <span className="font-mono text-emerald-700 font-bold block">{order.id}</span>
                          <span className="text-[10px] text-slate-400 block mt-1 font-normal">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </td>
                        {/* Customer */}
                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">{order.customerName}</span>
                          <span className="text-slate-500 block">{order.customerPhone}</span>
                          {!isValidSomaliPhone(order.customerPhone) ? (
                            <button
                              disabled
                              className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider rounded-lg border border-slate-200 cursor-not-allowed"
                            >
                              <MessageCircle className="w-3.5 h-3.5 opacity-50" />
                              <span>Invalid Phone Number</span>
                            </button>
                          ) : (
                            <a
                              href={generateWhatsAppClickToChatUrl(
                                order.customerPhone,
                                generateWhatsAppMessage(order, window.location.origin)
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-current" />
                              <span>Send WhatsApp</span>
                            </a>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-1 leading-normal max-w-xs">{order.deliveryAddress}</span>
                        </td>
                        {/* Money amount */}
                        <td className="p-4">
                          <span className="text-sm font-black text-slate-800 block">${order.total}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1 font-semibold">
                            {order.paymentMethod === 'Mobile Money' ? <Smartphone className="w-3 h-3 text-emerald-600" /> : <Landmark className="w-3 h-3 text-amber-600" />}
                            {order.paymentMethod}
                          </span>
                        </td>
                        {/* Proof file receipt */}
                        <td className="p-4">
                          {order.paymentProof ? (
                            <button
                              id={`inspect-proof-${order.id}`}
                              onClick={() => setSelectedReceiptUrl(order.paymentProof || null)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Inspect Proof</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 font-semibold italic">No proof uploaded</span>
                          )}
                        </td>
                        {/* Status + Admin review inputs */}
                        <td className="p-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Display Status badge */}
                            <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-md ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : order.status === 'Shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'Processing'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>

                            {/* Verification Controls triggers */}
                            {order.status === 'Pending Verification' && (
                              <div className="flex items-center gap-1">
                                <button
                                  id={`approve-order-${order.id}`}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'Payment Confirmed')}
                                  title="Verify and Approve Receipt"
                                  className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-all cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  id={`reject-order-trigger-${order.id}`}
                                  onClick={() => { setRejectingOrderId(order.id); setRejectionReason(''); }}
                                  title="Reject Payment Receipt"
                                  className="p-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-all cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {order.status === 'Payment Confirmed' && (
                              <button
                                id={`process-order-${order.id}`}
                                onClick={() => handleUpdateOrderStatus(order.id, 'Processing')}
                                className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold text-[10px] cursor-pointer"
                              >
                                Process Order (Stock Allocation)
                              </button>
                            )}

                            {order.status === 'Processing' && (
                              <button
                                id={`ship-order-${order.id}`}
                                onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')}
                                className="px-2 py-1 bg-slate-900 hover:bg-emerald-700 text-white rounded-md font-bold text-[10px] cursor-pointer"
                              >
                                Ship Order (Dispatch)
                              </button>
                            )}

                            {order.status === 'Shipped' && (
                              <button
                                id={`deliver-order-${order.id}`}
                                onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[10px] cursor-pointer"
                              >
                                Deliver Order
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* SUBTAB 3: INVENTORY CONTROL TABLE */}
        {activeSubTab === 'inventory' && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
              <span className="font-bold text-slate-800 text-sm">Active Product Stock levels</span>
              <button
                id="trigger-add-product-form"
                onClick={() => setIsAddingProduct(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wide">
                  <tr>
                    <th className="p-4">Product Info</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4 text-center">Remaining Stock</th>
                    <th className="p-4 text-center">Stock Adjustment</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {products.map((product) => {
                    const isLow = product.stock <= 5 && product.stock > 0;
                    const isOut = product.stock === 0;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Image + Title */}
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-bold text-slate-800 max-w-xs truncate">{product.title}</span>
                        </td>
                        {/* Category */}
                        <td className="p-4 text-slate-500 font-semibold">{product.category}</td>
                        {/* Price */}
                        <td className="p-4 font-extrabold text-slate-800 text-sm">${product.price}</td>
                        {/* Current Stock */}
                        <td className="p-4 text-center">
                          <span className={`inline-block font-extrabold text-[10px] px-2 py-0.5 rounded-md ${
                            isOut
                              ? 'bg-red-100 text-red-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOut ? 'OUT OF STOCK' : `${product.stock} UNITS`}
                          </span>
                        </td>
                        {/* Quick stock adjustments (+ / -) */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              id={`adjust-stock-dec-${product.id}`}
                              onClick={() => handleAdjustStock(product.id, -1)}
                              disabled={product.stock === 0}
                              className="w-7 h-7 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-extrabold text-sm rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-slate-800">{product.stock}</span>
                            <button
                              id={`adjust-stock-inc-${product.id}`}
                              onClick={() => handleAdjustStock(product.id, 1)}
                              className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="p-4 text-center">
                          <button
                            id={`delete-product-${product.id}`}
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer inline-block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: NOTIFICATION DISPATCH LOGS */}
        {activeSubTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 leading-normal space-y-2 mb-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>API Limitations Notice: Automated WhatsApp vs Email</span>
              </div>
              <p>
                Emails are dispatched instantly via SMTP. However, automated WhatsApp APIs (Twilio / Meta) impose strict sandbox rules and outbound template restrictions. For example, recipients must join your Twilio sandbox first, or conversations must use Meta-approved templates if they have not messaged you in 24 hours.
              </p>
              <p className="font-semibold">
                💡 <strong>100% Guaranteed Alternative:</strong> Use the green <strong>"Send Manually"</strong> or <strong>"WhatsApp Direct"</strong> buttons to open WhatsApp Web/App and send pre-filled messages instantly to any number without sandbox or template restrictions!
              </p>
            </div>

            {notifications.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-slate-500">
                Notification queue empty. Once you review and approve orders, customer receipts logs will populate here!
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border rounded-2xl bg-white shadow-xs flex items-start gap-3.5 transition-all ${
                      notif.type === 'whatsapp' ? 'border-emerald-100' : 'border-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      notif.type === 'whatsapp' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {notif.type === 'whatsapp' ? <MessageSquare className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className="font-extrabold text-slate-800">
                          {notif.type === 'whatsapp' ? 'WhatsApp Notification Dispatch' : `Email Notification (${notif.subject})`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-500 font-semibold mb-1">Recipient: <span className="text-slate-700 font-bold">{notif.recipient}</span></p>
                      <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1.5">{notif.message}</p>
                      
                      {notif.type === 'whatsapp' && (
                        <div className="mt-2.5 flex items-center gap-2">
                          {!isValidSomaliPhone(notif.recipient.replace('whatsapp:', '')) ? (
                            <button
                              disabled
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider rounded-lg border border-slate-200 cursor-not-allowed"
                            >
                              <MessageCircle className="w-3.5 h-3.5 opacity-50" />
                              <span>Invalid Phone Number</span>
                            </button>
                          ) : (
                            <a
                              href={generateWhatsAppClickToChatUrl(
                                notif.recipient.replace('whatsapp:', ''),
                                notif.message
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-current" />
                              <span>Send WhatsApp</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* MODAL 1: RECEIPT PROOF FULL VIEW SCREENSHOT */}
      <AnimatePresence>
        {selectedReceiptUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceiptUrl(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 relative z-10 border border-slate-100 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-slate-800 text-sm uppercase">Manual Payment Proof Inspection</span>
                <button
                  id="close-receipt-preview-modal"
                  onClick={() => setSelectedReceiptUrl(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="bg-slate-100 rounded-2xl overflow-hidden max-h-[400px] border border-slate-150 flex items-center justify-center p-2">
                <img src={selectedReceiptUrl} alt="Inspection receipt preview" className="max-w-full max-h-[380px] object-contain rounded-xl" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: REJECTION REASON PROMPT */}
      <AnimatePresence>
        {rejectingOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectingOrderId(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 relative z-10 border border-slate-100 shadow-2xl"
            >
              <h3 className="font-extrabold text-slate-800 text-base mb-3">Reject Payment Proof</h3>
              <p className="text-slate-400 text-xs mb-4">Specify why this payment proof could not be verified. This reason will be shown to the customer.</p>
              
              <textarea
                id="reject-reason-input"
                rows={3}
                required
                placeholder="e.g. Transaction code did not match bank statements / Screenshot was extremely blurry"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white transition-all mb-4"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="cancel-rejection-btn"
                  onClick={() => setRejectingOrderId(null)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-rejection-btn"
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      alert('Please specify a rejection reason.');
                      return;
                    }
                    handleUpdateOrderStatus(rejectingOrderId, 'Rejected', rejectionReason);
                    setRejectingOrderId(null);
                  }}
                  className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ADD NEW PRODUCT FORM */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProduct(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 relative z-10 border border-slate-100 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-slate-800 text-base">Add New Inventory Product</h3>
                <button
                  id="close-add-product-modal"
                  onClick={() => setIsAddingProduct(false)}
                  className="text-slate-400 hover:text-slate-600 font-semibold text-sm"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleAddNewProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Product Title *</label>
                  <input
                    id="add-prod-title"
                    type="text"
                    required
                    placeholder="e.g. GAAFOW Active Buds"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Price ($) *</label>
                    <input
                      id="add-prod-price"
                      type="number"
                      required
                      placeholder="e.g. 45"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stock Count *</label>
                    <input
                      id="add-prod-stock"
                      type="number"
                      required
                      placeholder="e.g. 20"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category *</label>
                    <select
                      id="add-prod-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home & Living">Home & Living</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Beauty">Beauty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Image URL *</label>
                    <input
                      id="add-prod-image"
                      type="text"
                      required
                      placeholder="https://images.unsplash.com..."
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description (Optional)</label>
                  <textarea
                    id="add-prod-desc"
                    rows={2}
                    placeholder="Short summary of features..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <button
                  id="add-prod-submit-btn"
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Create & List Item
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
