import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  History,
  TrendingDown,
  TrendingUp,
  Sliders,
  DollarSign,
  PackageCheck,
  PackageX,
  FileText,
} from 'lucide-react';
import { inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function InventoryView() {
  const { isAdmin } = useAuth();
  const { formatCurrency } = useSettings();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'logs'
  const [inventoryData, setInventoryData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState('20');
  const [adjustReason, setAdjustReason] = useState('Weekly supplier restock delivery');
  const [adjustType, setAdjustType] = useState('restock'); // 'restock' | 'adjustment'
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [activeTab]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      if (activeTab === 'stock') {
        const res = await inventoryService.getStatus();
        setInventoryData(res.data);
      } else {
        const res = await inventoryService.getLogs();
        setLogs(res.data || []);
      }
    } catch (err) {
      error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = (item, type = 'restock') => {
    setTargetItem(item);
    setAdjustType(type);
    setAdjustQty(type === 'restock' ? '25' : String(item.stockQuantity));
    setAdjustReason(type === 'restock' ? 'Stock delivery' : 'Manual stock count discrepancy correction');
    setShowRestockModal(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!targetItem || adjustQty === '') return;

    try {
      setSubmitting(true);
      await inventoryService.adjust({
        menuItemId: targetItem._id,
        quantity: Number(adjustQty),
        type: adjustType,
        reason: adjustReason,
      });

      success(`Inventory updated for "${targetItem.name}"`);
      setShowRestockModal(false);
      loadInventory();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const items = inventoryData?.items || [];
  const summary = inventoryData?.summary || {};

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Inventory & Stock Tracking</h2>
          <p className="text-xs text-slate-400">
            Real-time automated stock deductions on sales, restock adjustments, and audit logs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'stock'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Stock Status</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>
          </div>

          <button
            onClick={loadInventory}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Dishes Tracked</span>
          <div className="text-2xl font-black text-white mt-1">{summary.totalItems || 0} items</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Automated local stock sync</p>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl">
          <span className="text-[11px] font-bold text-amber-400 uppercase">Low Stock Alerts</span>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {summary.lowStockCount || 0} items
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Below alert threshold</p>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl">
          <span className="text-[11px] font-bold text-rose-400 uppercase">Sold Out (Zero Qty)</span>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {summary.outOfStockCount || 0} items
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Needs immediate restock</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Inventory Value</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(summary.totalInventoryValue || 0)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Cost Basis: {formatCurrency(summary.totalCostValue || 0)}
          </p>
        </div>
      </div>

      {/* Main Content: Stock Table or Audit Logs */}
      {activeTab === 'stock' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4 p-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search stock item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-bold uppercase">
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Stock Level</th>
                  <th className="p-3.5">Alert Threshold</th>
                  <th className="p-3.5">Stock Health</th>
                  {isAdmin && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredItems.map((item) => {
                  const isOut = item.stockQuantity === 0;
                  const isLow = item.stockQuantity <= item.minStockThreshold;

                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{item.image || '🍽️'}</span>
                          <div>
                            <div className="font-bold text-white text-xs">{item.name}</div>
                            {item.code && <div className="text-[10px] text-slate-500">{item.code}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-400">{item.category}</td>

                      <td className="p-3.5 font-mono font-bold text-sm">
                        <span
                          className={
                            isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                          }
                        >
                          {item.stockQuantity}
                        </span>{' '}
                        <span className="text-[10px] text-slate-500 font-normal">units</span>
                      </td>

                      <td className="p-3.5 text-slate-400">{item.minStockThreshold} units</td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isOut
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenAdjust(item, 'restock')}
                              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Restock</span>
                            </button>
                            <button
                              onClick={() => handleOpenAdjust(item, 'adjustment')}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                              title="Manual Adjust"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Logs Table */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-bold uppercase">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Item</th>
                  <th className="p-3.5">Event Type</th>
                  <th className="p-3.5">Quantity Change</th>
                  <th className="p-3.5">Stock Shift</th>
                  <th className="p-3.5">Reason & User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No stock movement logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-3.5 font-bold text-white">{log.itemName}</td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.changeType === 'sale'
                              ? 'bg-blue-500/20 text-blue-400'
                              : log.changeType === 'restock'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : log.changeType === 'cancellation_return'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {log.changeType}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-bold">
                        <span
                          className={log.quantityChanged > 0 ? 'text-emerald-400' : 'text-rose-400'}
                        >
                          {log.quantityChanged > 0
                            ? `+${log.quantityChanged}`
                            : log.quantityChanged}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {log.previousStock} ➔ <span className="text-white font-bold">{log.newStock}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="text-white">{log.reason || 'N/A'}</div>
                        <div className="text-[10px] text-slate-500">By: {log.user?.name || 'System'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock & Stock Adjustment Modal */}
      {showRestockModal && targetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {adjustType === 'restock' ? 'Restock Supplies' : 'Manual Stock Adjustment'}:{' '}
              <span className="text-orange-400">{targetItem.name}</span>
            </h3>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Current In-Stock Quantity:</span>
                  <span className="text-white font-bold">{targetItem.stockQuantity} units</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {adjustType === 'restock' ? 'Units to Add (+)' : 'Set Absolute Stock Level'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-base focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Reason / Note
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Supplier delivery invoice #482"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/30 transition"
                >
                  {submitting ? 'Applying...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
