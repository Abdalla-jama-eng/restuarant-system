import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Receipt,
  Database,
  Download,
  Upload,
  Save,
  CheckCircle,
  AlertTriangle,
  FileJson,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { backupService } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

export default function SettingsView() {
  const { settings, updateSettings, refreshSettings } = useSettings();
  const { success, error, warning } = useToast();

  const [formData, setFormData] = useState({
    restaurantName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    currencySymbol: '$',
    taxRate: 5.0,
    enableTax: true,
    receiptFooter: '',
    defaultLowStockAlert: 10,
  });

  const [submitting, setSubmitting] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restorePayload, setRestorePayload] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        restaurantName: settings.restaurantName || '',
        tagline: settings.tagline || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        currencySymbol: settings.currencySymbol || '$',
        taxRate: settings.taxRate || 0,
        enableTax: settings.enableTax !== false,
        receiptFooter: settings.receiptFooter || '',
        defaultLowStockAlert: settings.defaultLowStockAlert || 10,
      });
    }
  }, [settings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updateSettings(formData);
      success('Restaurant & POS settings updated successfully!');
      refreshSettings();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSubmitting(false);
    }
  };

  // Download Local Database Backup JSON
  const handleExportBackup = async () => {
    try {
      setBackupLoading(true);
      const res = await backupService.exportBackup();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `restaurant_pos_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      success('Complete local database backup downloaded!');
    } catch (err) {
      error('Failed to export database backup');
    } finally {
      setBackupLoading(false);
    }
  };

  // File Picker for Restore
  const handleFileChange = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (!parsed.data) {
            error('Invalid backup file format: missing "data" node');
            return;
          }
          setRestorePayload(parsed.data);
          setShowRestoreConfirm(true);
        } catch (err) {
          error('Invalid JSON file format');
        }
      };
    }
  };

  const handleConfirmRestore = async () => {
    if (!restorePayload) return;
    try {
      setSubmitting(true);
      const res = await backupService.restoreBackup(restorePayload);
      success(res.data.message || 'Database restored successfully!');
      setShowRestoreConfirm(false);
      setRestorePayload(null);
      refreshSettings();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to restore database');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white">System Settings & Local Database</h2>
        <p className="text-xs text-slate-400">
          Configure restaurant branding, currency symbol, tax calculation, and offline database backup
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Restaurant Identity Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-orange-400" />
            <span>Restaurant Branding & Contact</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline / Slogan</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Physical Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Financial, Currency & Tax Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Currency, Tax & Receipt Formatting</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sales Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-xs font-semibold text-slate-300">Enable Tax on Orders</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableTax}
                  onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Receipt Footer Message
              </label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save Configuration Changes'}</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Restore Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span>Local Database Backup & Restore</span>
          </h3>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
            100% Offline Compatible
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Create complete snapshot files (.json) of all menu items, orders, tables, cashier users,
          settings, and stock history. Store backups on USB drives or restore anytime without cloud.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Backup Button */}
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={backupLoading}
            className="p-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center gap-3 text-left transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Download Backup File</div>
              <div className="text-[11px] text-slate-400">Exports full database snapshot (.json)</div>
            </div>
          </button>

          {/* Restore File Input */}
          <label className="p-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center gap-3 text-left cursor-pointer transition group">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="sr-only"
            />
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Restore from Backup</div>
              <div className="text-[11px] text-slate-400">Upload and restore snapshot (.json)</div>
            </div>
          </label>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <ConfirmModal
          isOpen={showRestoreConfirm}
          title="Restore Database Snapshot"
          message="Restoring from a backup file will replace the current tables, categories, orders, menu items, and settings with the contents of the backup file. Are you sure you want to proceed?"
          confirmText="Yes, Restore Backup"
          confirmVariant="danger"
          onConfirm={handleConfirmRestore}
          onCancel={() => {
            setShowRestoreConfirm(false);
            setRestorePayload(null);
          }}
          loading={submitting}
        />
      )}
    </div>
  );
}
