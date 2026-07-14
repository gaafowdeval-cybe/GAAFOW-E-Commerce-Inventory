import React, { useState } from 'react';
import { Order } from '../types';
import { Search, Loader2, Calendar, MapPin, Phone, CreditCard, ShoppingBag, Eye, HelpCircle, Check, ShieldCheck, Truck, Package, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import {
  isValidSomaliPhone,
  generateWhatsAppMessage,
  generateWhatsAppClickToChatUrl
} from '../lib/whatsapp';

interface OrderTrackerProps {
  orders: Order[];
}

export default function OrderTracker({ orders }: OrderTrackerProps) {
  const [searchId, setSearchId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('orderId');
    if (orderIdParam) {
      const trimmed = orderIdParam.trim();
      setSearchId(trimmed);
      const found = orders.find(
        (o) => o.id.toLowerCase() === trimmed.toLowerCase()
      );
      setSearchedOrder(found || null);
      setSearchTriggered(true);
    }
  }, [orders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    const found = orders.find(
      (o) => o.id.toLowerCase() === searchId.trim().toLowerCase()
    );
    setSearchedOrder(found || null);
    setSearchTriggered(true);
  };

  const getStepStatus = (step: number, currentStatus: Order['status']) => {
    // Timeline steps:
    // 1: Pending Verification (Submitted)
    // 2: Confirmed (Payment Confirmed / Approved)
    // 3: Processing
    // 4: Shipped
    // 5: Delivered

    const statusMap: Record<Order['status'], number> = {
      'Pending Verification': 1,
      'Rejected': 1, // Rejected stays on step 1 but in a red style
      'Payment Confirmed': 2,
      'Processing': 3,
      'Shipped': 4,
      'Delivered': 5
    };

    const currentStep = statusMap[currentStatus] || 1;

    if (currentStatus === 'Rejected') {
      if (step === 1) return 'rejected';
      return 'upcoming';
    }

    if (currentStep >= step) {
      return currentStep === step ? 'active' : 'completed';
    }
    return 'upcoming';
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Track Your Purchase
        </h1>
        <p className="text-slate-400 text-sm mt-1.5">
          Enter your unique GAAFOW Order ID to check real-time stock allocation, delivery status, and payment approvals.
        </p>
      </div>

      {/* Tracker Search Form */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-10 flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="tracker-search-input"
            type="text"
            placeholder="e.g., GF-1001"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 text-slate-800 font-medium text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs placeholder-slate-400 transition-all"
          />
        </div>
        <button
          id="tracker-search-submit"
          type="submit"
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all cursor-pointer shadow-xs"
        >
          Track
        </button>
      </form>

      {/* Results Section */}
      {searchTriggered && searchedOrder ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Tracker Banner Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-50 mb-6">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Order ID</span>
                <span className="text-lg font-black text-slate-800 tracking-wider font-mono">{searchedOrder.id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Status</span>
                <span className={`inline-block font-extrabold text-[11px] px-2.5 py-0.5 rounded-md mt-1.5 ${
                  searchedOrder.status === 'Delivered'
                    ? 'bg-emerald-100 text-emerald-800'
                    : searchedOrder.status === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : searchedOrder.status === 'Shipped'
                    ? 'bg-blue-100 text-blue-800'
                    : searchedOrder.status === 'Processing'
                    ? 'bg-cyan-100 text-cyan-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {searchedOrder.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Rejection alert */}
            {searchedOrder.status === 'Rejected' && (
              <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl text-xs text-red-800 leading-relaxed">
                <p className="font-extrabold text-sm mb-1.5 flex items-center gap-1.5">
                  Order Payment Rejected
                </p>
                <p className="font-medium mb-3">Reason: {searchedOrder.rejectionReason || 'Uploaded payment receipt is blurred or incorrect.'}</p>
                <p>Please contact GAAFOW customer service via WhatsApp with your correct transaction receipt to get your order approved instantly.</p>
                <a
                  href={`https://wa.me/252615550000?text=${encodeURIComponent(`Hello, my order ${searchedOrder.id} was rejected. Here is my correct payment proof.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-[10px] hover:bg-red-700 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Contact Support
                </a>
              </div>
            )}

            {/* Timeline Visuals */}
            <div className="py-4">
              <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-2">
                
                {/* Horizontal bar (only on medium screens+) */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-100 hidden md:block -z-1" />

                {/* Step 1: Placed */}
                <div className="flex flex-col items-center text-center relative z-10 w-full md:w-1/5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm border-2 ${
                    searchedOrder.status === 'Rejected'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-emerald-600 text-white border-emerald-600'
                  }`}>
                    {searchedOrder.status === 'Rejected' ? '✕' : <Check className="w-5 h-5 stroke-[3px]" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 mt-2 block">Submitted</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{new Date(searchedOrder.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Step 2: Verified */}
                {(() => {
                  const s = getStepStatus(2, searchedOrder.status);
                  return (
                    <div className="flex flex-col items-center text-center relative z-10 w-full md:w-1/5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm border-2 ${
                        s === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : s === 'active'
                          ? 'bg-amber-500 text-slate-950 border-amber-500 animate-pulse'
                          : 'bg-white text-slate-300 border-slate-200'
                      }`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-bold mt-2 block ${s === 'upcoming' ? 'text-slate-300' : 'text-slate-800'}`}>Verified</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Payment Review</span>
                    </div>
                  );
                })()}

                {/* Step 3: Processing */}
                {(() => {
                  const s = getStepStatus(3, searchedOrder.status);
                  return (
                    <div className="flex flex-col items-center text-center relative z-10 w-full md:w-1/5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm border-2 ${
                        s === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : s === 'active'
                          ? 'bg-amber-500 text-slate-950 border-amber-500 animate-pulse'
                          : 'bg-white text-slate-300 border-slate-200'
                      }`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-bold mt-2 block ${s === 'upcoming' ? 'text-slate-300' : 'text-slate-800'}`}>Processing</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Stock Allocation</span>
                    </div>
                  );
                })()}

                {/* Step 4: Shipped */}
                {(() => {
                  const s = getStepStatus(4, searchedOrder.status);
                  return (
                    <div className="flex flex-col items-center text-center relative z-10 w-full md:w-1/5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm border-2 ${
                        s === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : s === 'active'
                          ? 'bg-amber-500 text-slate-950 border-amber-500 animate-pulse'
                          : 'bg-white text-slate-300 border-slate-200'
                      }`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-bold mt-2 block ${s === 'upcoming' ? 'text-slate-300' : 'text-slate-800'}`}>Shipped</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Out for Dispatch</span>
                    </div>
                  );
                })()}

                {/* Step 5: Delivered */}
                {(() => {
                  const s = getStepStatus(5, searchedOrder.status);
                  return (
                    <div className="flex flex-col items-center text-center relative z-10 w-full md:w-1/5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm border-2 ${
                        s === 'active' || s === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-300 border-slate-200'
                      }`}>
                        <Check className="w-4 h-4 stroke-[3px]" />
                      </div>
                      <span className={`text-xs font-bold mt-2 block ${s === 'upcoming' ? 'text-slate-300' : 'text-slate-800'}`}>Delivered</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Completed</span>
                    </div>
                  );
                })()}

              </div>
            </div>

          </div>

          {/* Details breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Delivery details */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-50 uppercase tracking-wider">
                Delivery & Customer Details
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 block">Ordered On</span>
                    <p>{new Date(searchedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 block">Delivery Address</span>
                    <p>{searchedOrder.customerName}</p>
                    <p>{searchedOrder.deliveryAddress}</p>
                    {searchedOrder.deliveryNotes && (
                      <p className="text-[11px] text-emerald-700 italic mt-1">Note: {searchedOrder.deliveryNotes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-700 block">Contact Information</span>
                    <p className="text-slate-600 font-medium">{searchedOrder.customerPhone} ({searchedOrder.customerEmail})</p>
                    
                    <div className="mt-2">
                      {!isValidSomaliPhone(searchedOrder.customerPhone) ? (
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
                            searchedOrder.customerPhone,
                            generateWhatsAppMessage(searchedOrder, window.location.origin)
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
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 block">Payment Method</span>
                    <p>{searchedOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Preview & Items */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-50 uppercase tracking-wider">
                Order Content & Payment Proof
              </h3>
              
              {/* Product items list */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {searchedOrder.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                    <span className="font-bold text-slate-800 line-clamp-1 flex-1 pr-4">{item.title} (x{item.quantity})</span>
                    <span className="text-slate-500 shrink-0">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Total display */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-150 text-xs">
                <span className="font-bold text-slate-500">Grand Total Paid:</span>
                <span className="text-base font-black text-slate-900">${searchedOrder.total}</span>
              </div>

              {/* Uploaded Receipt Viewer */}
              {searchedOrder.paymentProof && (
                <div className="pt-2">
                  <span className="font-bold text-slate-700 text-xs block mb-2">Uploaded Receipt Image:</span>
                  <div className="relative rounded-xl overflow-hidden border border-slate-150 max-h-32 bg-slate-50 flex items-center justify-center group cursor-pointer" onClick={() => {
                    const win = window.open();
                    win?.document.write(`<img src="${searchedOrder.paymentProof}" style="max-width:100%; max-height:100vh; margin:auto; display:block;" />`);
                  }}>
                    <img src={searchedOrder.paymentProof} alt="Receipt proof" className="w-full object-contain max-h-32" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <span className="text-white text-xs font-bold bg-slate-900/80 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Click to expand
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      ) : searchTriggered ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center max-w-md mx-auto shadow-sm">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Order ID Not Found</h3>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            We couldn't locate any order with that ID in our system. Please make sure there are no typos in your code (e.g., GF-1001).
          </p>
          
          <div className="mt-5 pt-4 border-t border-slate-100 text-left">
            <span className="text-[10px] text-slate-400 font-bold block mb-2 uppercase">Sample Order IDs for testing:</span>
            <div className="flex gap-2">
              <button
                id="sample-track-1"
                onClick={() => { setSearchId('GF-1001'); }}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 cursor-pointer"
              >
                GF-1001
              </button>
              <button
                id="sample-track-2"
                onClick={() => { setSearchId('GF-1002'); }}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 cursor-pointer"
              >
                GF-1002
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty default view instruction card */
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 max-w-md mx-auto text-center">
          <Truck className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-700 text-sm font-semibold">Ready to track your order?</p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Once you make a purchase from GAAFOW and submit your receipt, you can view real-time shipping milestones, approval notes, and inventory status directly here.
          </p>
        </div>
      )}

    </div>
  );
}
