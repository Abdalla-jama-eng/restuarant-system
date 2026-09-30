import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Check,
  Percent,
  Banknote,
  Send,
  Coffee,
  Sparkles,
  AlertCircle,
  Tag,
  User,
  Hash,
} from 'lucide-react';
import { menuService, categoryService, tableService, orderService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import CheckoutModal from '../components/CheckoutModal';
import ReceiptModal from '../components/ReceiptModal';

export default function POSView() {
  const { settings, formatCurrency } = useSettings();
  const { success, error, warning } = useToast();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'takeaway'
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Modals & Receipts
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, menuRes, tblRes] = await Promise.all([
        categoryService.getAll(),
        menuService.getAll(),
        tableService.getAll(),
      ]);
      setCategories(catRes.data || []);
      setMenuItems(menuRes.data || []);
      setTables(tblRes.data || []);

      // Auto pick first available table if available
      const avail = (tblRes.data || []).find((t) => t.status === 'available');
      if (avail) {
        setSelectedTable(avail._id);
      }
    } catch (err) {
      error('Failed to load menu items or tables');
    } finally {
      setLoading(false);
    }
  };

  // Add Item to Cart
  const addToCart = (item) => {
    if (item.stockQuantity <= 0) {
      warning(`"${item.name}" is out of stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        if (existing.quantity >= item.stockQuantity) {
          warning(`Cannot exceed available stock of ${item.stockQuantity}`);
          return prev;
        }
        return prev.map((i) =>
          i._id === item._id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
            : i
        );
      } else {
        return [
          ...prev,
          {
            _id: item._id,
            name: item.name,
            price: item.price,
            costPrice: item.costPrice || 0,
            quantity: 1,
            subtotal: item.price,
            stockQuantity: item.stockQuantity,
            notes: '',
          },
        ];
      }
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item._id === itemId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.stockQuantity) {
              warning(`Max available stock: ${item.stockQuantity}`);
              return item;
            }
            if (nextQty <= 0) return null;
            return { ...item, quantity: nextQty, subtotal: nextQty * item.price };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const updateItemNotes = (itemId, notes) => {
    setCart((prev) =>
      prev.map((i) => (i._id === itemId ? { ...i, notes } : i))
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i._id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setCustomerName('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = settings.enableTax ? settings.taxRate || 0 : 0;
  const taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  // Filter Items
  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Handle Order Submit (Hold Order or Direct Settle)
  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      warning('Please add items to cart first');
      return;
    }

    const tableObj = tables.find((t) => t._id === selectedTable);

    try {
      setSubmitting(true);
      const payload = {
        orderType,
        tableId: orderType === 'dine-in' ? selectedTable : null,
        tableNumber: orderType === 'dine-in' ? tableObj?.tableNumber || 'Table' : 'Takeaway',
        customerName: customerName || (orderType === 'dine-in' ? 'Dine-In Guest' : 'Takeaway Customer'),
        items: cart.map((i) => ({
          menuItemId: i._id,
          name: i.name,
          price: i.price,
          costPrice: i.costPrice,
          quantity: i.quantity,
          notes: i.notes,
        })),
        discountPercent,
        settleImmediately: false,
      };

      const res = await orderService.create(payload);
      success(`Order #${res.data.orderNumber} sent to Kitchen / Saved!`);
      clearCart();
      loadData(); // Refresh stock & tables
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  // Payment Confirmation from CheckoutModal
  const handleCompletePayment = async ({ paymentMethod, amountPaid, autoPrint }) => {
    const tableObj = tables.find((t) => t._id === selectedTable);

    try {
      setSubmitting(true);
      const payload = {
        orderType,
        tableId: orderType === 'dine-in' ? selectedTable : null,
        tableNumber: orderType === 'dine-in' ? tableObj?.tableNumber || 'Table' : 'Takeaway',
        customerName: customerName || (orderType === 'dine-in' ? 'Dine-In Guest' : 'Takeaway Customer'),
        items: cart.map((i) => ({
          menuItemId: i._id,
          name: i.name,
          price: i.price,
          costPrice: i.costPrice,
          quantity: i.quantity,
          notes: i.notes,
        })),
        discountPercent,
        paymentMethod,
        amountPaid,
        settleImmediately: true,
      };

      const res = await orderService.create(payload);
      success(`Payment processed! Order #${res.data.orderNumber} completed.`);
      setShowCheckoutModal(false);
      setCreatedOrder(res.data);
      clearCart();
      loadData();

      if (autoPrint) {
        setShowReceiptModal(true);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to complete payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden select-none bg-slate-950">
      {/* Left Area: Menu Catalog */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        {/* Top Control Bar: Search & Categories */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name or item code..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                selectedCategory === 'All'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🔥 All Items</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">
                {menuItems.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = menuItems.filter((i) => i.category === cat.name).length;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                    selectedCategory === cat.name
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Loading menu catalog...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Utensils className="w-12 h-12 opacity-40" />
              <p className="text-sm">No menu items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredItems.map((item) => {
                const isOutOfStock = item.stockQuantity <= 0;
                const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= item.minStockThreshold;

                return (
                  <button
                    key={item._id}
                    onClick={() => addToCart(item)}
                    disabled={isOutOfStock}
                    className={`relative text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                      isOutOfStock
                        ? 'bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed'
                        : 'bg-slate-900/90 hover:bg-slate-850 hover:border-orange-500/50 border-slate-800 shadow-md hover:shadow-orange-500/10 active:scale-[0.98]'
                    }`}
                  >
                    {/* Top: Icon/Emoji & Stock Tag */}
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl p-1.5 rounded-xl bg-slate-800 border border-slate-700">
                        {item.image || '🍽️'}
                      </span>

                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold">
                          Sold Out
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                          {item.stockQuantity} left
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">
                          Qty: {item.stockQuantity}
                        </span>
                      )}
                    </div>

                    {/* Middle: Title & Category */}
                    <div className="space-y-0.5 my-1">
                      <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{item.category}</p>
                    </div>

                    {/* Bottom: Price & Quick Add Plus */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
                      <span className="text-sm font-extrabold text-orange-400">
                        {formatCurrency(item.price)}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-orange-500/15 group-hover:bg-orange-500 text-orange-400 group-hover:text-white flex items-center justify-center transition">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Order Cart Pane */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-slate-900 flex flex-col shrink-0 border-l border-slate-800">
        {/* Cart Header: Order Type & Table Selection */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 space-y-3">
          {/* Order Type Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setOrderType('dine-in')}
              className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                orderType === 'dine-in'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Dine-In</span>
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                orderType === 'takeaway'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Takeaway</span>
            </button>
          </div>

          {/* Table Selector (if Dine-in) & Customer Name */}
          <div className="grid grid-cols-2 gap-2">
            {orderType === 'dine-in' ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Select Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                >
                  {tables.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.tableNumber} ({t.status === 'available' ? 'Free' : t.status})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Order Type
                </label>
                <div className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-orange-400 text-xs font-bold">
                  Takeaway / Pickup
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="e.g. John / Table 4"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-8">
              <ShoppingCart className="w-12 h-12 opacity-30" />
              <p className="text-xs font-medium">Cart is empty</p>
              <p className="text-[11px] text-slate-600">Click dishes from the menu to build order</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item._id}
                className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-white leading-tight">{item.name}</h5>
                    <div className="text-[11px] text-slate-400">
                      {formatCurrency(item.price)} each
                    </div>
                  </div>
                  <div className="text-xs font-extrabold text-orange-400">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>

                {/* Item Notes input & Qty controls */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-750">
                  <input
                    type="text"
                    placeholder="Notes (e.g. no onions)"
                    value={item.notes}
                    onChange={(e) => updateItemNotes(item._id, e.target.value)}
                    className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-[10px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />

                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item._id, -1)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item._id, 1)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Actions */}
        {cart.length > 0 && (
          <div className="p-4 bg-slate-850 border-t border-slate-800 space-y-3">
            {/* Discount Preset Chips */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Discount:</span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      discountPercent === pct
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs border-t border-slate-750 pt-2 text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {settings.enableTax && (
                <div className="flex justify-between text-slate-400">
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-white pt-1.5 border-t border-slate-700">
                <span>Total Amount</span>
                <span className="text-orange-400">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {orderType === 'dine-in' && (
                <button
                  type="button"
                  onClick={handleHoldOrder}
                  disabled={submitting}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Send to Kitchen</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCheckoutModal(true)}
                disabled={submitting}
                className={`${
                  orderType === 'dine-in' ? 'col-span-1' : 'col-span-2'
                } py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5`}
              >
                <Banknote className="w-4 h-4" />
                <span>Pay {formatCurrency(totalAmount)}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        totalAmount={totalAmount}
        onConfirmPayment={handleCompletePayment}
        loading={submitting}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        order={createdOrder}
      />
    </div>
  );
}
