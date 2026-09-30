import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  Users,
  CreditCard,
  Banknote,
  Smartphone,
  Ban,
  ArrowDownToLine,
} from 'lucide-react';
import { reportService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function ReportsView() {
  const { formatCurrency, settings } = useSettings();
  const { success, error } = useToast();

  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const params = { period };
      if (period === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await reportService.getSales(params);
      setReport(res.data);
    } catch (err) {
      error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFilter = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      error('Please select both start and end date');
      return;
    }
    setPeriod('custom');
    loadReport();
  };

  // Export CSV
  const exportCSV = () => {
    if (!report) return;
    const summary = report.summary || {};

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `RESTAURANT SALES REPORT - ${settings.restaurantName || 'BiteFlow POS'}\r\n`;
    csvContent += `Report Period,${period.toUpperCase()}\r\n`;
    csvContent += `Generated On,${new Date().toLocaleString()}\r\n\r\n`;

    csvContent += `SUMMARY METRICS\r\n`;
    csvContent += `Total Orders,${summary.totalOrders || 0}\r\n`;
    csvContent += `Completed Orders,${summary.completedCount || 0}\r\n`;
    csvContent += `Gross Sales,${summary.totalGrossSales || 0}\r\n`;
    csvContent += `Discounts,${summary.totalDiscounts || 0}\r\n`;
    csvContent += `Tax Collected,${summary.totalTax || 0}\r\n`;
    csvContent += `Net Revenue,${summary.totalNetRevenue || 0}\r\n`;
    csvContent += `Cost Basis (COGS),${summary.totalCogs || 0}\r\n`;
    csvContent += `Estimated Profit,${summary.estimatedGrossProfit || 0}\r\n`;
    csvContent += `Average Order Value,${summary.averageOrderValue || 0}\r\n\r\n`;

    csvContent += `TOP SELLING ITEMS\r\n`;
    csvContent += `Item Name,Quantity Sold,Revenue,Unit Price\r\n`;
    report.topSellingItems?.forEach((item) => {
      csvContent += `"${item.name}",${item.quantitySold},${item.revenue},${item.price}\r\n`;
    });
    csvContent += `\r\n`;

    csvContent += `CASHIER PERFORMANCE\r\n`;
    csvContent += `Cashier Name,Orders Count,Total Sales\r\n`;
    report.cashierPerformance?.forEach((c) => {
      csvContent += `"${c.name}",${c.ordersCount},${c.totalSales}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV report exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = report?.summary || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Sales & Revenue Reports</h2>
          <p className="text-xs text-slate-400">
            Audit daily, weekly, and monthly performance, cashier revenues, and profit summaries
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Period Tabs & Custom Date Picker */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
        {/* Preset Period Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto scrollbar-none">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'weekly', label: 'Last 7 Days' },
            { id: 'monthly', label: 'This Month' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                period === tab.id
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Range */}
        <form onSubmit={handleCustomFilter} className="flex items-center gap-2 w-full lg:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
          />
          <span className="text-slate-500 text-xs font-bold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 font-bold text-xs rounded-xl transition"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Financial KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Sales</span>
          <div className="text-lg font-black text-white mt-1">
            {formatCurrency(summary.totalGrossSales || 0)}
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">Before tax/discounts</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Discounts Given</span>
          <div className="text-lg font-black text-rose-400 mt-1">
            -{formatCurrency(summary.totalDiscounts || 0)}
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">Promo reductions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Tax Collected</span>
          <div className="text-lg font-black text-amber-300 mt-1">
            {formatCurrency(summary.totalTax || 0)}
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">Government tax</p>
        </div>

        <div className="bg-slate-900 border border-orange-500/30 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-orange-400 uppercase">Net Revenue</span>
          <div className="text-xl font-black text-orange-400 mt-1">
            {formatCurrency(summary.totalNetRevenue || 0)}
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">Actual cash collected</p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Est. Gross Profit</span>
          <div className="text-xl font-black text-emerald-400 mt-1">
            {formatCurrency(summary.estimatedGrossProfit || 0)}
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">
            COGS: {formatCurrency(summary.totalCogs || 0)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Average Ticket</span>
          <div className="text-lg font-black text-blue-400 mt-1">
            {formatCurrency(summary.averageOrderValue || 0)}
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">Across {summary.completedCount || 0} tickets</p>
        </div>
      </div>

      {/* Middle Grid: Top Selling Items & Staff Cashier Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Dishes */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span>Top Performing Menu Items</span>
          </h3>

          <div className="space-y-3">
            {report?.topSellingItems?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No items sold in this period</p>
            ) : (
              report?.topSellingItems?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 font-extrabold flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-slate-400 text-[10px]">
                        {item.quantitySold} units sold @ {formatCurrency(item.price)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-black text-emerald-400 text-sm">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cashier Staff Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Cashier Performance & Shift Sales</span>
          </h3>

          <div className="space-y-3">
            {report?.cashierPerformance?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No cashier transactions logged</p>
            ) : (
              report?.cashierPerformance?.map((cashier, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center">
                      {cashier.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{cashier.name}</div>
                      <div className="text-slate-400 text-[10px]">
                        {cashier.ordersCount} closed orders
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-black text-orange-400 text-sm">
                    {formatCurrency(cashier.totalSales)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cancelled Orders Audit Log */}
      {report?.cancelledOrders && report.cancelledOrders.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
            <Ban className="w-4 h-4" />
            <span>Cancelled Orders Audit Report ({report.cancelledOrders.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Cashier</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">Cancellation Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {report.cancelledOrders.map((co, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-mono font-bold text-white">{co.orderNumber}</td>
                    <td className="py-2.5">{co.customerName}</td>
                    <td className="py-2.5 text-slate-400">{co.cashier}</td>
                    <td className="py-2.5 text-rose-400 font-bold">
                      {formatCurrency(co.totalAmount)}
                    </td>
                    <td className="py-2.5 text-slate-300 italic">{co.reason || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
