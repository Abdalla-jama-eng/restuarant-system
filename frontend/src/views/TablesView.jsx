import React, { useState, useEffect } from 'react';
import {
  Grid,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  BookmarkCheck,
  ShoppingBag,
  DollarSign,
  Utensils,
  AlertCircle,
} from 'lucide-react';
import { tableService, orderService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function TablesView({ setActiveTab }) {
  const { isAdmin } = useAuth();
  const { formatCurrency } = useSettings();
  const { success, error, warning } = useToast();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [notes, setNotes] = useState('');

  // Reserve Modal
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveTargetTable, setReserveTargetTable] = useState(null);
  const [reservedByName, setReservedByName] = useState('');

  // Delete Confirm
  const [deleteTargetTable, setDeleteTargetTable] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await tableService.getAll();
      setTables(res.data || []);
    } catch (err) {
      error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingTable(null);
    setTableNumber(`Table ${tables.length + 1}`);
    setCapacity(4);
    setNotes('');
    setShowTableModal(true);
  };

  const handleOpenEdit = (tbl) => {
    setEditingTable(tbl);
    setTableNumber(tbl.tableNumber);
    setCapacity(tbl.capacity);
    setNotes(tbl.notes || '');
    setShowTableModal(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingTable) {
        await tableService.update(editingTable._id, {
          tableNumber,
          capacity: Number(capacity),
          notes,
        });
        success('Table updated successfully');
      } else {
        await tableService.create({
          tableNumber,
          capacity: Number(capacity),
          notes,
        });
        success('Table added successfully');
      }
      setShowTableModal(false);
      loadTables();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteTargetTable) return;
    try {
      setSubmitting(true);
      await tableService.delete(deleteTargetTable._id);
      success('Table deleted successfully');
      setDeleteTargetTable(null);
      loadTables();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!reserveTargetTable) return;
    try {
      setSubmitting(true);
      await tableService.updateStatus(reserveTargetTable._id, {
        status: 'reserved',
        reservedBy: reservedByName,
      });
      success(`Table ${reserveTargetTable.tableNumber} marked as Reserved for ${reservedByName}`);
      setShowReserveModal(false);
      setReservedByName('');
      setReserveTargetTable(null);
      loadTables();
    } catch (err) {
      error('Failed to reserve table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseStatus = async (tableId) => {
    try {
      await tableService.updateStatus(tableId, { status: 'available' });
      success('Table status set to Available');
      loadTables();
    } catch (err) {
      error('Failed to update table');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Table & Floor Plan Management</h2>
          <p className="text-xs text-slate-400">
            Real-time visual table status, seating capacity, and active order linkage
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Table</span>
          </button>
        )}
      </div>

      {/* Tables Status Stats Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-400 uppercase">Available</p>
            <p className="text-xl font-black text-white">
              {tables.filter((t) => t.status === 'available').length} Tables
            </p>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-400 uppercase">Occupied</p>
            <p className="text-xl font-black text-white">
              {tables.filter((t) => t.status === 'occupied').length} Tables
            </p>
          </div>
          <span className="w-3 h-3 rounded-full bg-rose-400"></span>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-400 uppercase">Reserved</p>
            <p className="text-xl font-black text-white">
              {tables.filter((t) => t.status === 'reserved').length} Tables
            </p>
          </div>
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading tables...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => {
            const isAvailable = table.status === 'available';
            const isOccupied = table.status === 'occupied';
            const isReserved = table.status === 'reserved';
            const activeOrder = table.currentOrderId;

            return (
              <div
                key={table._id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                  isAvailable
                    ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
                    : isOccupied
                    ? 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-500/40 shadow-rose-950/20'
                    : 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/40'
                }`}
              >
                {/* Top: Table Title & Capacity */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white">{table.tableNumber}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{table.capacity} Seats</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      isAvailable
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isOccupied
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                {/* Middle: Active Order / Reservation Details */}
                <div className="py-2 border-y border-slate-800/80 text-xs">
                  {isOccupied && activeOrder ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Order #:</span>
                        <span className="font-mono font-bold text-white">{activeOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Total Due:</span>
                        <span className="font-bold text-orange-400">
                          {formatCurrency(activeOrder.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ) : isReserved ? (
                    <div className="space-y-1 text-amber-300">
                      <div className="font-semibold">Reserved for: {table.reservedBy || 'Guest'}</div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">Ready for new dine-in guests</div>
                  )}
                </div>

                {/* Bottom: Actions */}
                <div className="space-y-2">
                  {isAvailable && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActiveTab('pos')}
                        className="py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order</span>
                      </button>
                      <button
                        onClick={() => {
                          setReserveTargetTable(table);
                          setShowReserveModal(true);
                        }}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                      >
                        Reserve
                      </button>
                    </div>
                  )}

                  {isOccupied && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Settle Bill</span>
                      </button>
                      <button
                        onClick={() => handleReleaseStatus(table._id)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                      >
                        Free Table
                      </button>
                    </div>
                  )}

                  {isReserved && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleReleaseStatus(table._id)}
                        className="col-span-2 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition"
                      >
                        Release / Seat Guest
                      </button>
                    </div>
                  )}

                  {/* Admin Edit/Delete buttons */}
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEdit(table)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetTable(table)}
                        disabled={isOccupied}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingTable ? 'Edit Restaurant Table' : 'Add New Table'}
            </h3>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Table Number / Name
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. Table 5, Patio 2, VIP 1"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Window side, near terrace"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-600/30 transition"
                >
                  {submitting ? 'Saving...' : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reserve Table Modal */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              Reserve {reserveTargetTable?.tableNumber}
            </h3>

            <form onSubmit={handleReserve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer / Guest Name
                </label>
                <input
                  type="text"
                  required
                  value={reservedByName}
                  onChange={(e) => setReservedByName(e.target.value)}
                  placeholder="e.g. Smith Family (7:00 PM)"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/30 transition"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Table Confirmation */}
      {deleteTargetTable && (
        <ConfirmModal
          isOpen={!!deleteTargetTable}
          title={`Delete ${deleteTargetTable.tableNumber}`}
          message="Are you sure you want to remove this table from the floor plan?"
          confirmText="Delete Table"
          confirmVariant="danger"
          onConfirm={handleDeleteTable}
          onCancel={() => setDeleteTargetTable(null)}
          loading={submitting}
        />
      )}
    </div>
  );
}
