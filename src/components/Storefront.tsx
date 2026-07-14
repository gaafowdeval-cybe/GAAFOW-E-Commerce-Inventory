import { useState } from 'react';
import { Product } from '../types';
import { Star, MessageCircle, AlertCircle, ShoppingCart, Plus, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StorefrontProps {
  products: Product[];
  searchQuery: string;
  onAddToCart: (product: Product, quantity?: number) => void;
}

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home & Living', 'Groceries', 'Beauty'];

export default function Storefront({ products, searchQuery, onAddToCart }: StorefrontProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Filtered products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) return;
    onAddToCart(product, quantity);
    
    // Trigger localized visual feedback
    setAddedItemIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
  };

  const handleDirectWhatsAppInquiry = (product: Product) => {
    const text = `Hello GAAFOW! I am interested in purchasing your product "${product.title}" listed for $${product.price}. Is it currently in stock?`;
    window.open(`https://wa.me/252615550000?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Banner / Hero section */}
      <div className="relative mb-10 rounded-3xl overflow-hidden bg-slate-950 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-800 via-slate-900 to-slate-950" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
            Exclusive Selection
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Premium Shopping <br/>
            <span className="text-emerald-400">Simplified for You.</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
            Welcome to GAAFOW, your ultimate e-commerce companion. Browse quality items, enjoy seamless payments with receipts verification, and track your orders in real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              id="hero-shop-now"
              onClick={() => {
                const element = document.getElementById('products-grid-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-emerald-600/20"
            >
              Shop Collection
            </button>
            <a
              id="hero-whatsapp-contact"
              href="https://wa.me/252615550000"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              WhatsApp Orders
            </a>
          </div>
        </div>
        
        {/* Subtle decorative mock graphics */}
        <div className="absolute right-12 bottom-0 top-0 hidden lg:flex items-center justify-center opacity-60">
          <div className="relative w-80 h-80 rounded-full bg-emerald-600/10 border border-emerald-500/20 animate-pulse flex items-center justify-center">
            <div className="w-60 h-60 rounded-full bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
              <ShoppingCart className="w-20 h-20 text-emerald-500/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="mb-8" id="products-grid-section">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-600 rounded-full" />
          Explore Categories
        </h2>
        <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              id={`category-filter-${category.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-slate-800 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-700 font-medium text-lg">No products found</p>
          <p className="text-slate-400 text-sm mt-1">Try modifying your search or choosing a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const isLowStock = product.stock > 0 && product.stock <= 5;
            const isOutOfStock = product.stock === 0;
            const isAdded = addedItemIds[product.id];

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group"
              >
                {/* Product Image */}
                <div 
                  className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => openProductDetails(product)}
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Category badge */}
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {product.category}
                  </span>

                  {/* Stock alert badges */}
                  {isOutOfStock ? (
                    <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase">
                      Sold Out
                    </span>
                  ) : isLowStock ? (
                    <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase animate-pulse">
                      Only {product.stock} Left!
                    </span>
                  ) : null}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Rating & reviews */}
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {product.rating} ({product.reviewsCount})
                      </span>
                    </div>

                    {/* Title */}
                    <h3 
                      className="font-bold text-slate-800 text-base leading-tight hover:text-emerald-700 cursor-pointer transition-colors line-clamp-1 mb-1.5"
                      onClick={() => openProductDetails(product)}
                    >
                      {product.title}
                    </h3>

                    {/* Description excerpt */}
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Footer (Price & Action) */}
                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block leading-none uppercase">Price</span>
                      <span className="text-lg font-black text-slate-800">${product.price}</span>
                    </div>

                    <div className="flex gap-1.5">
                      {/* WhatsApp Quick Ask */}
                      <button
                        title="Inquire via WhatsApp"
                        onClick={() => handleDirectWhatsAppInquiry(product)}
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      {/* Add to Cart */}
                      <button
                        id={`add-to-cart-btn-${product.id}`}
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{isAdded ? 'Added' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative z-10 border border-slate-100"
            >
              {/* Product Info Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                
                {/* Image Section */}
                <div className="relative h-64 md:h-full bg-slate-100">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                </div>

                {/* Details Section */}
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-700 text-xs font-bold uppercase tracking-wide">
                        In Stock • Real-Time Count
                      </span>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                      >
                        Close
                      </button>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
                      {selectedProduct.title}
                    </h2>

                    {/* Rating stars */}
                    <div className="flex items-center gap-1.5 mb-4">
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < Math.floor(selectedProduct.rating) ? 'fill-current' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {selectedProduct.rating} / 5.0 ({selectedProduct.reviewsCount} reviews)
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                      {selectedProduct.description}
                    </p>

                    {/* Stock tracker status banner */}
                    <div className="mb-4 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Stock Tracker</span>
                        <p className="text-[11px] text-slate-500">
                          {selectedProduct.stock === 0 ? (
                            <span className="text-red-600 font-semibold">Currently Out of Stock. Contact us for re-stock alerts.</span>
                          ) : selectedProduct.stock <= 5 ? (
                            <span className="text-amber-600 font-semibold">Critical Stock! Only {selectedProduct.stock} items remaining.</span>
                          ) : (
                            <span>Currently {selectedProduct.stock} items are ready for rapid shipping.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Unit Price</span>
                        <span className="text-2xl font-black text-slate-800">${selectedProduct.price}</span>
                      </div>

                      {/* Quantity Selector */}
                      {selectedProduct.stock > 0 && (
                        <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
                          <button
                            onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-slate-800 font-bold text-sm">
                            {detailQuantity}
                          </span>
                          <button
                            onClick={() => setDetailQuantity(q => Math.min(selectedProduct.stock, q + 1))}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Buy via WhatsApp */}
                      <button
                        onClick={() => handleDirectWhatsAppInquiry(selectedProduct)}
                        className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-200"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Inquire
                      </button>

                      {/* Add to Cart */}
                      <button
                        onClick={() => {
                          handleAddToCart(selectedProduct, detailQuantity);
                          setSelectedProduct(null);
                        }}
                        disabled={selectedProduct.stock <= 0}
                        className={`w-full font-bold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedProduct.stock <= 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart (${selectedProduct.price * detailQuantity})
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
