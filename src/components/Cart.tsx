import { Product } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: { product: Product; quantity: number }[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function Cart({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartProps) {
  
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-lg">Your Shopping Cart</span>
                </div>
                <button
                  id="close-cart-drawer-btn"
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                      <ShoppingBag className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-800 font-bold text-base">Your cart is empty</p>
                    <p className="text-slate-400 text-sm mt-1 mb-6">Explore our premium catalog to add some items!</p>
                    <button
                      id="cart-empty-browse-btn"
                      onClick={onClose}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-4 py-3 border-b border-slate-50"
                      >
                        {/* Image */}
                        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Title & Quantity selectors */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate leading-tight mb-1">
                            {item.product.title}
                          </h4>
                          <span className="text-xs text-slate-400 block font-semibold mb-2">
                            ${item.product.price} each
                          </span>
                          
                          {/* Quantity adjust */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white rounded-md transition-colors text-sm font-semibold"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-slate-700">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white rounded-md transition-colors text-sm font-semibold"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-slate-300">|</span>
                            <span className="text-[11px] text-slate-400">
                              Stock: {item.product.stock}
                            </span>
                          </div>
                        </div>

                        {/* Price & Remove */}
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-sm text-slate-800 block">
                            ${item.product.price * item.quantity}
                          </span>
                          <button
                            id={`remove-cart-item-${item.product.id}`}
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-slate-400 hover:text-red-500 p-1.5 transition-colors mt-2 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout / Footer */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-slate-500">Subtotal</span>
                    <span className="text-xl font-black text-slate-800">${subtotal}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mb-5">
                    Shipping and delivery charges will be calculated on checkout. Receipt or screenshot of payment is required to finalize order.
                  </p>
                  
                  <button
                    id="cart-proceed-checkout-btn"
                    onClick={() => {
                      onCheckout();
                      onClose();
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
