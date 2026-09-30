import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Grid,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Utensils,
  Receipt,
  Users,
  Clock,
  CheckCircle,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { reportService, inventoryService, tableService, orderService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function DashboardView({ setActiveTab }) {
  const { formatCurrency } = useSettings();
  const { error } = useToast();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [tables, setTables] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [repRes, invRes, tblRes, ordRes] = await Promise.all([
        reportService.getSales({ period: 'today' }),
        inventoryService.getStatus(),
        tableService.getAll(),
        orderService.getAll({ limit: 6 }),
      ]);

      setReportData(repRes.data);
      setInventoryData(invRes.data);
      setTables(tblRes.data || []);
      setRecentOrders(ordRes.data || []);
    } catch (err) {
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const totalTables = tables.length;
  const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Loading restaurant dashboard metrics...
      </div>
    );
  }

  const summary = reportData?.summary || {};
  const lowStockCount = inventoryData?.summary?.lowStockCount || 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Top Welcome & Quick Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-600/20 via-amber-600/10 to-transparent border border-orange-500/20 p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <span>⚡ Offline POS Operational</span>
            <span>•</span>
            <span>MongoDB Local Connected</span>
          </div>
          <h2 className="text-2xl font-black text-white">Today's Restaurant Overview</h2>
          <p className="text-xs text-slate-400">
            Real-time sales, order tickets, table occupancy, and stock alert summaries.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Sales Analytics</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Today's Total Sales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {formatCurrency(summary.totalNetRevenue || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gross Profit: <span className="text-emerald-400 font-semibold">{formatCurrency(summary.estimatedGrossProfit || 0)}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Today's Orders */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Orders Today</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {summary.totalOrders || 0}{' '}
              <span className="text-xs font-normal text-slate-400">tickets</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Avg Ticket: <span className="text-blue-400 font-semibold">{formatCurrency(summary.averageOrderValue || 0)}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Table Occupancy */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Table Occupancy</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Grid className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {occupiedTables} / {totalTables}{' '}
              <span className="text-xs font-normal text-slate-400">({occupancyRate}%)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalTables - occupiedTables} tables ready for seating
            </p>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div
          onClick={() => setActiveTab('inventory')}
          className={`p-5 rounded-3xl space-y-3 border cursor-pointer transition shadow-lg ${
            lowStockCount > 0
              ? 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/40'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Stock Alerts</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                lowStockCount > 0
                  ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {lowStockCount}{' '}
              <span className="text-xs font-normal text-slate-400">items low</span>
            </div>
            <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5 font-medium">
              <span>Click to restock supplies</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Top Selling Items & Payment / Order Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Items (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Top Selling Menu Items</h3>
              <p className="text-xs text-slate-400">Dishes with highest sales volume today</p>
            </div>
            <button
              onClick={() => setActiveTab('menu')}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
            >
              <span>Manage Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {reportData?.topSellingItems?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No menu items sold yet today. Create an order from POS!
              </p>
            ) : (
              reportData?.topSellingItems?.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[11px] text-slate-400">{item.quantitySold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-[10px] text-slate-400">{formatCurrency(item.price)} ea</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Low Stock Alert</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                {lowStockCount} critical
              </span>
            </div>

            <div className="space-y-2">
              {inventoryData?.lowStockItems?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400 opacity-60" />
                  <span>All ingredients and items are sufficiently stocked!</span>
                </div>
              ) : (
                inventoryData?.lowStockItems?.slice(0, 4).map((item) => (
                  <div
                    key={item._id}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-amber-500/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-extrabold text-[11px]">
                        {item.stockQuantity} left
                      </span>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        Min: {item.minStockThreshold}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('inventory')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mt-4"
          >
            <span>Open Inventory Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Orders Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Live feed of orders created across all cashiers</p>
          </div>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                <th className="pb-3">Order #</th>
                <th className="pb-3">Type / Table</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Cashier</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No recent orders found.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-white">{order.orderNumber}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold uppercase">
                        {order.tableNumber || order.orderType}
                      </span>
                    </td>
                    <td className="py-3">{order.customerName}</td>
                    <td className="py-3 text-slate-400">{order.cashier?.name || 'Staff'}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.orderStatus === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : order.orderStatus === 'cancelled'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right font-extrabold text-orange-400">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
