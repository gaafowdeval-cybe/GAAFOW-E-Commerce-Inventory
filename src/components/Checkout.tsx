import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Upload, FileText, Landmark, Smartphone, ArrowLeft, Copy, Check, ShoppingBag, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutProps {
  cartItems: { product: Product; quantity: number }[];
  onPlaceOrder: (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryNotes?: string;
    paymentMethod: string;
    paymentProof: string;
  }) => string;
  onCancel: () => void;
}

export default function Checkout({ cartItems, onPlaceOrder, onCancel }: CheckoutProps) {
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Mobile Money');
  const [paymentProof, setPaymentProof] = useState<string>('');
  
  // States for interactive copy
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal > 100 ? 0 : 10;
  const grandTotal = subtotal + deliveryFee;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG/JPG) as payment proof.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProof(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address) {
      alert('Please fill out all required contact and delivery fields.');
      return;
    }
    if (!paymentProof) {
      alert('Please upload a screenshot or photo of your payment transaction receipt.');
      return;
    }

    const orderId = onPlaceOrder({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      deliveryAddress: address,
      deliveryNotes: notes,
      paymentMethod,
      paymentProof
    });

    setOrderSuccessId(orderId);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Back to store */}
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-semibold mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Storefront
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Checkout forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Customer details */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-emerald-600 rounded-full" />
              1. Delivery & Contact Details
            </h2>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name *</label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  placeholder="e.g. Abdirahman Yusuf"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address *</label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    placeholder="e.g. yusuf@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number *</label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    placeholder="e.g. +252 61 555 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Delivery Address *</label>
                <textarea
                  id="checkout-address"
                  required
                  rows={2}
                  placeholder="Street name, District, City (e.g., Maka Al Mukarama Rd, Hodan, Mogadishu)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Order Delivery Notes (Optional)</label>
                <input
                  id="checkout-notes"
                  type="text"
                  placeholder="e.g., Deliver after 4:00 PM, call upon arrival"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>
            </form>
          </div>

          {/* Section 2: Payment options */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-emerald-600 rounded-full" />
              2. Make Payment
            </h2>

            {/* Selector tabs */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                id="pay-method-mobile"
                onClick={() => { setPaymentMethod('Mobile Money'); setPaymentProof(''); }}
                className={`py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  paymentMethod === 'Mobile Money'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile Money
              </button>
              <button
                id="pay-method-bank"
                onClick={() => { setPaymentMethod('Bank Transfer'); setPaymentProof(''); }}
                className={`py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  paymentMethod === 'Bank Transfer'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Landmark className="w-4 h-4" />
                Bank Transfer
              </button>
            </div>

            {/* Instruction cards */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs text-slate-600 mb-6 leading-relaxed">
              <p className="font-bold text-slate-800 text-sm mb-2">Instructions:</p>
              {paymentMethod === 'Mobile Money' ? (
                <div className="space-y-3">
                  <p>Send exactly <span className="font-extrabold text-slate-800">${grandTotal}</span> using our local merchants services:</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">EVC Plus / Premier Wallet</span>
                        <span className="font-extrabold text-slate-800 text-sm">*712*617624424*{grandTotal}#</span>
                      </div>
                      <button
                        onClick={() => handleCopy(`*712*617624424*${grandTotal}#`, 'evc')}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedText === 'evc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'evc' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">ZAAD / Telesom Merchant</span>
                        <span className="font-extrabold text-slate-800 text-sm">Merchant ID: 38372870</span>
                      </div>
                      <button
                        onClick={() => handleCopy('38372870', 'zaad')}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedText === 'zaad' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'zaad' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p>Transfer exactly <span className="font-extrabold text-slate-800">${grandTotal}</span> to our official bank account:</p>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Premier Bank Account</span>
                        <span className="font-extrabold text-slate-800 text-sm">Account: 100482200922</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Name: GAAFOW E-COMMERCE CO.</span>
                      </div>
                      <button
                        onClick={() => handleCopy('100482200922', 'bank_prem')}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedText === 'bank_prem' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'bank_prem' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Salaam Somali Bank</span>
                        <span className="font-extrabold text-slate-800 text-sm">Account: 409923881</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Name: GAAFOW E-COMMERCE CO.</span>
                      </div>
                      <button
                        onClick={() => handleCopy('409923881', 'bank_sal')}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedText === 'bank_sal' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'bank_sal' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* File upload zone with drag and drop */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Upload Payment Proof Receipt *
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-600 bg-emerald-50/40 scale-[0.99]'
                    : paymentProof
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <input
                  id="checkout-upload-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {paymentProof ? (
                  <div className="space-y-3">
                    <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden border border-emerald-200 shadow-sm relative group">
                      <img src={paymentProof} alt="Receipt preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-emerald-800 font-bold text-xs">Receipt Image Captured!</p>
                      <button
                        id="checkout-clear-proof"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentProof('');
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold mt-1.5 underline"
                      >
                        Remove and replace receipt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-500">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-xs text-slate-700">Drag & drop receipt image or click to browse</p>
                    <p className="text-[10px] text-slate-400">Supports JPG, PNG screenshots (max 4MB)</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs sticky top-28 space-y-5">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-50">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Order Summary
            </h3>

            {/* Cart products items */}
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-60 pr-1">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 py-3">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                    <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-800 truncate">{item.product.title}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">Qty: {item.quantity} × ${item.product.price}</span>
                  </div>
                  <span className="font-extrabold text-xs text-slate-800">${item.product.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Pricing breakdown */}
            <div className="space-y-2 pt-3 border-t border-slate-50 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold">${subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charge</span>
                <span className="font-bold">{deliveryFee === 0 ? <span className="text-emerald-600 uppercase font-extrabold text-[10px]">Free Shipping</span> : `$${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-slate-800 text-sm font-black pt-2 border-t border-slate-150">
                <span>Total Amount Due</span>
                <span className="text-base font-black text-slate-900">${grandTotal}</span>
              </div>
            </div>

            {/* Critical alert/notice */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex gap-2">
              <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-800 leading-normal">
                <strong>Verification Notice:</strong> GAAFOW processes payments manually. Once you upload your proof of payment and place the order, our staff will review and approve it within 15 minutes.
              </p>
            </div>

            {/* Complete order button */}
            <button
              id="place-order-submit-btn"
              onClick={handleSubmit}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Place Order (${grandTotal})
            </button>
          </div>
        </div>

      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {orderSuccessId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-center relative z-10 border border-slate-100 shadow-2xl"
            >
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 stroke-[3px]" />
              </div>

              <h3 className="font-black text-slate-800 text-xl leading-tight mb-2">Order Placed Successfully!</h3>
              <p className="text-slate-500 text-xs px-2 mb-6 leading-relaxed">
                Thank you for shopping with GAAFOW! Your payment receipt has been uploaded and is being verified by our finance team.
              </p>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl mb-6 text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Your Order ID:</span>
                  <span className="font-extrabold text-emerald-700 tracking-wider font-mono">{orderSuccessId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Total Amount Paid:</span>
                  <span className="font-black text-slate-800">${grandTotal}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Status:</span>
                  <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md">PENDING VERIFICATION</span>
                </div>
              </div>

              <button
                id="success-order-track-btn"
                onClick={onCancel} // This will trigger returning to main tab where they can choose to track
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Continue & Track Order
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
