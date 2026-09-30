import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Receipt,
  Printer,
  Ban,
  CheckCircle,
  Clock,
  Banknote,
  Eye,
  Utensils,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { orderService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import ReceiptModal from '../components/ReceiptModal';
import CheckoutModal from '../components/CheckoutModal';
import ConfirmModal from '../components/ConfirmModal';

export default function OrdersView() {
  const { formatCurrency } = useSettings();
  const { success, error, warning } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for viewing receipt or settling
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);
  const [settleOrder, setSettleOrder] = useState(null);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Customer request');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'All') {
        if (filterStatus === 'dine-in' || filterStatus === 'takeaway') {
          params.orderType = filterStatus;
        } else {
          params.status = filterStatus;
        }
      }
      const res = await orderService.getAll(params);
      setOrders(res.data || []);
    } catch (err) {
      error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Settle Payment
  const handleSettlePayment = async ({ paymentMethod, amountPaid }) => {
    if (!settleOrder) return;

    try {
      setSubmitting(true);
      const res = await orderService.pay(settleOrder._id, {
        paymentMethod,
        amountPaid,
      });

      success(`Order #${res.data.orderNumber} settled successfully!`);
      setSettleOrder(null);
      setActiveReceiptOrder(res.data);
      loadOrders();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to settle order');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Status
  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      await orderService.updateStatus(orderId, { status: nextStatus });
      success(`Order status updated to ${nextStatus}`);
      loadOrders();
    } catch (err) {
      error('Failed to update status');
    }
  };

  // Cancel Order
  const handleConfirmCancel = async () => {
    if (!cancelTargetOrder) return;

    try {
      setSubmitting(true);
      await orderService.cancel(cancelTargetOrder._id, { reason: cancelReason });
      success(`Order #${cancelTargetOrder.orderNumber} cancelled. Stock restored to inventory.`);
      setCancelTargetOrder(null);
      loadOrders();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter by Search Query
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
      (o.cashier?.name && o.cashier.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Order Management & History</h2>
          <p className="text-xs text-slate-400">
            Track active dining tickets, takeaway pickups, and settled sales
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { id: 'All', label: 'All Orders' },
            { id: 'pending', label: '⏳ Pending' },
            { id: 'completed', label: '✅ Completed' },
            { id: 'dine-in', label: '🍽️ Dine-In' },
            { id: 'takeaway', label: '🛍️ Takeaway' },
            { id: 'cancelled', label: '🚫 Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                filterStatus === tab.id
                  ? 'bg-orange-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, table, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-bold uppercase">
                <th className="p-4">Order Details</th>
                <th className="p-4">Type / Table</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4">Amount & Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 space-y-2">
                    <Receipt className="w-10 h-10 opacity-30 mx-auto" />
                    <p className="font-medium text-sm">No orders found matching criteria</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.paymentStatus === 'paid';
                  const isCancelled = order.orderStatus === 'cancelled';
                  const isCompleted = order.orderStatus === 'completed';

                  return (
                    <tr key={order._id} className="hover:bg-slate-800/40 transition">
                      {/* Order Details */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-white text-sm">
                          {order.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Cashier: {order.cashier?.name || 'Staff'}
                        </div>
                      </td>

                      {/* Type / Table */}
                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {order.tableNumber || (order.orderType === 'takeaway' ? 'Takeaway' : 'Counter')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.customerName || 'Guest'}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="p-4 max-w-xs">
                        <div className="font-medium text-slate-200 line-clamp-1">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Total {order.items.reduce((s, i) => s + i.quantity, 0)} items
                        </div>
                      </td>

                      {/* Amount & Payment */}
                      <td className="p-4">
                        <div className="font-extrabold text-orange-400 text-sm">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPaid
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">
                            ({order.paymentMethod})
                          </span>
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isCancelled
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                        {isCancelled && order.cancelReason && (
                          <div className="text-[10px] text-rose-400/80 italic mt-0.5">
                            "{order.cancelReason}"
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Settle Bill Button */}
                          {!isPaid && !isCancelled && (
                            <button
                              onClick={() => setSettleOrder(order)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1"
                              title="Settle Payment"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Settle</span>
                            </button>
                          )}

                          {/* Print / View Receipt */}
                          <button
                            onClick={() => setActiveReceiptOrder(order)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                            title="Print / View Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Status toggle if pending */}
                          {!isCompleted && !isCancelled && (
                            <button
                              onClick={() => handleStatusChange(order._id, 'completed')}
                              className="p-1.5 bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-slate-700 transition"
                              title="Mark as Completed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Cancel Order */}
                          {!isCancelled && (
                            <button
                              onClick={() => setCancelTargetOrder(order)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-rose-400 rounded-lg border border-slate-700 transition"
                              title="Cancel Order & Return Stock"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Payment Modal */}
      {settleOrder && (
        <CheckoutModal
          isOpen={!!settleOrder}
          onClose={() => setSettleOrder(null)}
          totalAmount={settleOrder.totalAmount}
          orderNumber={settleOrder.orderNumber}
          onConfirmPayment={handleSettlePayment}
          loading={submitting}
        />
      )}

      {/* Receipt Preview & Thermal Print Modal */}
      <ReceiptModal
        isOpen={!!activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
        order={activeReceiptOrder}
      />

      {/* Cancel Order Confirmation */}
      {cancelTargetOrder && (
        <ConfirmModal
          isOpen={!!cancelTargetOrder}
          title={`Cancel Order #${cancelTargetOrder.orderNumber}`}
          message="Are you sure you want to cancel this order? All items will be automatically returned to inventory stock, and any linked table will be freed."
          confirmText="Yes, Cancel Order"
          confirmVariant="danger"
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancelTargetOrder(null)}
          loading={submitting}
        />
      )}
    </div>
  );
}
