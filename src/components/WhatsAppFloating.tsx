import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WhatsAppFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Encode message for WhatsApp
    const phone = '252617624424'; // Updated customer support phone number
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    setMessage('');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-between overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Support agent"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">GAAFOW Customer Care</h4>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online • Responds Fast
                  </div>
                </div>
              </div>
              <button
                id="close-whatsapp-btn"
                onClick={() => setIsOpen(false)}
                className="text-emerald-100 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-slate-50 min-h-[120px] text-sm text-slate-600 flex flex-col justify-end">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] self-start mb-2">
                <p className="text-xs text-slate-400 font-semibold mb-1">GAAFOW Support</p>
                Hello there! Welcome to GAAFOW Support. How can we help you today with your order or shopping experience?
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 bg-slate-50 text-slate-800 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all"
              />
              <button
                id="send-whatsapp-message"
                type="submit"
                className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <motion.button
        id="toggle-whatsapp-widget"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer"
      >
        <MessageSquare className="w-5 h-5 animate-bounce" />
        <span>WhatsApp Support</span>
      </motion.button>
    </div>
  );
}
