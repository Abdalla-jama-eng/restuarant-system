import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  FolderPlus,
  Check,
  X,
  AlertTriangle,
  Boxes,
  DollarSign,
  Tag,
} from 'lucide-react';
import { menuService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function MenuView() {
  const { isAdmin } = useAuth();
  const { formatCurrency } = useSettings();
  const { success, error, warning } = useToast();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Add/Edit Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    price: '',
    costPrice: '',
    stockQuantity: '50',
    minStockThreshold: '10',
    image: '🍔',
    description: '',
    isAvailable: true,
  });

  // Category Manager Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Delete Confirm
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);
  const [deleteTargetCategory, setDeleteTargetCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const [menuRes, catRes] = await Promise.all([
        menuService.getAll(),
        categoryService.getAll(),
      ]);
      setMenuItems(menuRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: `ITM-${menuItems.length + 1}`,
      category: categories[0]?.name || 'Burgers & Wraps',
      price: '',
      costPrice: '',
      stockQuantity: '50',
      minStockThreshold: '10',
      image: '🍔',
      description: '',
      isAvailable: true,
    });
    setShowItemModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code || '',
      category: item.category,
      price: String(item.price),
      costPrice: String(item.costPrice || 0),
      stockQuantity: String(item.stockQuantity),
      minStockThreshold: String(item.minStockThreshold || 10),
      image: item.image || '🍽️',
      description: item.description || '',
      isAvailable: item.isAvailable !== false,
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      error('Name, category and price are required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await menuService.update(editingItem._id, formData);
        success('Menu item updated successfully');
      } else {
        await menuService.create(formData);
        success('Menu item created successfully');
      }
      setShowItemModal(false);
      loadMenuData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTargetItem) return;
    try {
      setSubmitting(true);
      await menuService.delete(deleteTargetItem._id);
      success('Menu item deleted');
      setDeleteTargetItem(null);
      loadMenuData();
    } catch (err) {
      error('Failed to delete item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await menuService.toggleAvailability(item._id);
      success(`Availability updated for "${item.name}"`);
      loadMenuData();
    } catch (err) {
      error('Failed to toggle availability');
    }
  };

  // Category Actions
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      setSubmitting(true);
      await categoryService.create({ name: newCatName, description: newCatDesc });
      success('Category added');
      setNewCatName('');
      setNewCatDesc('');
      loadMenuData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      await categoryService.delete(catId);
      success('Category deleted');
      setDeleteTargetCategory(null);
      loadMenuData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const emojis = ['🍔', '🍕', '🥩', '🍟', '🍗', '🥗', '🍝', '🌮', '🌯', '🍹', '☕', '🍰', '🍫', '🍦', '🍣', '🥪', '🥟', '🥤'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Menu & Dish Management</h2>
          <p className="text-xs text-slate-400">
            Configure food items, beverage categories, selling prices, and stock limits
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <FolderPlus className="w-4 h-4 text-orange-400" />
              <span>Manage Categories</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedCategory === 'All'
                ? 'bg-orange-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedCategory === cat.name
                  ? 'bg-orange-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dish or SKU code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-bold uppercase">
                <th className="p-4">Dish Info</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price / Cost</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Availability</th>
                {isAdmin && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading menu items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    No dishes found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stockQuantity <= item.minStockThreshold;
                  const isOut = item.stockQuantity === 0;

                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      {/* Dish Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                            {item.image || '🍽️'}
                          </span>
                          <div>
                            <div className="font-bold text-white text-sm">{item.name}</div>
                            {item.code && (
                              <div className="font-mono text-[10px] text-slate-400">{item.code}</div>
                            )}
                            {item.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                          {item.category}
                        </span>
                      </td>

                      {/* Price / Cost */}
                      <td className="p-4">
                        <div className="font-bold text-orange-400 text-sm">
                          {formatCurrency(item.price)}
                        </div>
                        {isAdmin && item.costPrice > 0 && (
                          <div className="text-[10px] text-slate-500">
                            Cost: {formatCurrency(item.costPrice)} (Margin:{' '}
                            {Math.round(((item.price - item.costPrice) / item.price) * 100)}%)
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {item.stockQuantity} units
                          </span>
                          {isOut ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                              Low
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Min Alert: {item.minStockThreshold}
                        </div>
                      </td>

                      {/* Availability Switch */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                            item.isAvailable
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          <span>{item.isAvailable ? 'Available' : 'Unavailable'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                              title="Edit Item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetItem(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Dish Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-white">
              {editingItem ? 'Edit Dish Details' : 'Add New Menu Item'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Emoji Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dish Icon / Emoji
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-900 border border-slate-700 rounded-xl">
                  {emojis.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: em })}
                      className={`text-xl p-1.5 rounded-lg transition ${
                        formData.image === em ? 'bg-orange-500/30 scale-125' : 'hover:bg-slate-800'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Smash Cheeseburger"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Item Code / SKU</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. BGR-01"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Low-Stock Alert Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockThreshold}
                    onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients, allergy notes, flavor profile..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-600/30 transition"
                >
                  {submitting ? 'Saving...' : 'Save Menu Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">Manage Categories</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleCreateCategory} className="space-y-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Seafood & Platters"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                + Add Category
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {categories.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                >
                  <span className="font-bold text-white">{c.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(c._id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirm */}
      {deleteTargetItem && (
        <ConfirmModal
          isOpen={!!deleteTargetItem}
          title={`Delete "${deleteTargetItem.name}"`}
          message="Are you sure you want to delete this menu item permanently?"
          confirmText="Delete Item"
          confirmVariant="danger"
          onConfirm={handleDeleteItem}
          onCancel={() => setDeleteTargetItem(null)}
          loading={submitting}
        />
      )}
    </div>
  );
}
