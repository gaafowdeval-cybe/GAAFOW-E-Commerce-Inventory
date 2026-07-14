import { useEffect } from 'react';
import { Mail, MessageSquare, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification } from '../types';

interface NotificationToastProps {
  notifications: AppNotification[];
  onRemove: (id: string) => void;
}

export default function NotificationToast({ notifications, onRemove }: NotificationToastProps) {
  
  // Auto-remove toasts after 6 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      const timer = setTimeout(() => {
        onRemove(latest.id);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notifications, onRemove]);

  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.slice(-3).map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="pointer-events-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 flex gap-3 overflow-hidden relative"
          >
            {/* Left side: Icon */}
            <div className={`p-2 rounded-xl shrink-0 ${
              notif.type === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {notif.type === 'whatsapp' ? <MessageSquare className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            </div>

            {/* Middle side: details */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">
                {notif.type === 'whatsapp' ? 'Auto-WhatsApp Dispatched' : 'System-Email Dispatched'}
              </span>
              <p className="text-xs font-bold text-slate-100 truncate">
                To: {notif.recipient}
              </p>
              <p className="text-[11px] text-slate-300 leading-normal mt-1 font-medium">
                {notif.message}
              </p>
            </div>

            {/* Right side: close */}
            <button
              onClick={() => onRemove(notif.id)}
              className="text-slate-400 hover:text-white p-1 shrink-0 self-start cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Status indicators */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 flex justify-end">
              <div className="w-full bg-emerald-500/20" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
