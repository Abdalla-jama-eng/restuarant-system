import React, { useState, useEffect } from 'react';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Check,
  X,
  Calculator,
  ArrowRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function CheckoutModal({
  isOpen,
  onClose,
  totalAmount,
  onConfirmPayment,
  loading = false,
  orderNumber = '',
}) {
  const { formatCurrency, settings } = useSettings();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [autoPrint, setAutoPrint] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash');
      setTenderedAmount(String(totalAmount));
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  const tenderedNum = Number(tenderedAmount) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);
  const isInsufficient = paymentMethod === 'cash' && tenderedNum < totalAmount;

  // Preset cash quick buttons
  const cashPresets = [
    { label: 'Exact', value: totalAmount },
    { label: '$10', value: 10 },
    { label: '$20', value: 20 },
    { label: '$50', value: 50 },
    { label: '$100', value: 100 },
  ].filter((p) => p.label === 'Exact' || p.value >= totalAmount);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isInsufficient) return;

    onConfirmPayment({
      paymentMethod,
      amountPaid: paymentMethod === 'cash' ? tenderedNum : totalAmount,
      changeAmount: paymentMethod === 'cash' ? changeDue : 0,
      autoPrint,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
              {orderNumber ? `Order #${orderNumber}` : 'Payment Processing'}
            </span>
            <h2 className="text-xl font-bold text-white">Settle Bill & Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Total Due Banner */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Total Amount Due</p>
              <p className="text-3xl font-extrabold text-orange-400 tracking-tight">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 font-medium border border-orange-500/30">
                Ready for Settle
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  setTenderedAmount(String(totalAmount));
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/20 font-semibold'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
              >
                <Banknote className="w-6 h-6 mb-1.5 text-emerald-400" />
                <span className="text-sm">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('card');
                  setTenderedAmount(String(totalAmount));
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/20 font-semibold'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-6 h-6 mb-1.5 text-blue-400" />
                <span className="text-sm">Credit/Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('mobile');
                  setTenderedAmount(String(totalAmount));
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                  paymentMethod === 'mobile'
                    ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/20 font-semibold'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-6 h-6 mb-1.5 text-purple-400" />
                <span className="text-sm">Mobile / Wallet</span>
              </button>
            </div>
          </div>

          {/* Cash Details & Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/80">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Amount Tendered by Customer
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                    {settings.currencySymbol || '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white font-bold text-xl focus:outline-none focus:border-orange-500 transition"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2">
                {cashPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTenderedAmount(String(preset.value))}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition active:scale-95"
                  >
                    {preset.label === 'Exact' ? `Exact (${formatCurrency(preset.value)})` : preset.label}
                  </button>
                ))}
              </div>

              {/* Calculated Change Display */}
              <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-300 font-medium">Change to Return:</span>
                <span
                  className={`text-xl font-extrabold ${
                    isInsufficient ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {isInsufficient
                    ? `Short by ${formatCurrency(totalAmount - tenderedNum)}`
                    : formatCurrency(changeDue)}
                </span>
              </div>
            </div>
          )}

          {/* Print receipt switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-700/50">
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Print thermal receipt upon completion</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-3 rounded-xl text-slate-300 hover:bg-slate-700 font-medium text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInsufficient}
              className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-xl transition flex items-center justify-center gap-2 ${
                isInsufficient
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 active:scale-[0.99]'
              }`}
            >
              <Check className="w-5 h-5" />
              {loading ? 'Processing...' : `Complete Payment (${formatCurrency(totalAmount)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
