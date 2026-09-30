import React, { useRef } from 'react';
import { Printer, X, CheckCircle, Store, Phone, MapPin, Receipt, Clock, User } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function ReceiptModal({ isOpen, onClose, order }) {
  const { settings, formatCurrency } = useSettings();
  const receiptRef = useRef(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Screen Preview Modal */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-white">Order Receipt Preview</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Paper Simulation */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900/40">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="bg-white text-slate-900 p-6 rounded-xl shadow-md font-mono text-xs max-w-xs mx-auto border border-slate-200 space-y-3"
          >
            {/* Restaurant Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <h2 className="text-base font-bold tracking-tight text-black uppercase">
                {settings.restaurantName || 'BiteFlow POS'}
              </h2>
              {settings.tagline && <p className="text-[10px] text-slate-600">{settings.tagline}</p>}
              <p className="text-[10px] text-slate-600">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
            </div>

            {/* Meta Info */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Invoice #:</span>
                <span className="font-bold text-black">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Type / Table:</span>
                <span className="font-semibold uppercase">
                  {order.orderType === 'takeaway' ? 'Takeaway' : order.tableNumber || 'Dine-In'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cashier:</span>
                <span>{order.cashier?.name || 'Staff'}</span>
              </div>
              {order.customerName && order.customerName !== 'Walk-in Guest' && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-slate-700 pb-1 border-b border-slate-200">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/3 text-right">Amount</span>
              </div>
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start py-0.5">
                  <div className="w-1/2 leading-tight">
                    <div className="font-medium text-black">{item.name}</div>
                    {item.notes && <div className="text-[9px] text-slate-500 italic">({item.notes})</div>}
                  </div>
                  <div className="w-1/6 text-center text-slate-700">{item.quantity}x</div>
                  <div className="w-1/3 text-right font-medium text-black">
                    {formatCurrency(item.subtotal || item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1 text-[11px] pt-1 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount ({order.discountPercent}%):</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({order.taxPercent}%):</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-400 text-black">
                <span>TOTAL:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Method:</span>
                <span className="font-semibold uppercase">{order.paymentMethod || 'Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tendered Amount:</span>
                <span>{formatCurrency(order.amountPaid || order.totalAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-black">
                <span className="text-slate-600">Change Due:</span>
                <span>{formatCurrency(order.changeAmount || 0)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 text-center border-t border-dashed border-slate-400 space-y-1">
              <p className="text-[10px] text-slate-700 font-medium leading-tight">
                {settings.receiptFooter || 'Thank you for your visit!'}
              </p>
              <p className="text-[9px] text-slate-500">*** 100% Offline POS Record ***</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-medium text-sm transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 font-semibold text-sm text-white shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            Print POS Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
