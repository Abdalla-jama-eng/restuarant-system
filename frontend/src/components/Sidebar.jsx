import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Grid,
  UtensilsCrossed,
  Boxes,
  BarChart3,
  Users,
  Settings,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { isAdmin } = useAuth();

  const adminNavItems = [
    { id: 'pos', label: 'POS Terminal', icon: ShoppingCart, highlight: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders & Sales', icon: Receipt },
    { id: 'tables', label: 'Tables & Seating', icon: Grid },
    { id: 'menu', label: 'Menu & Dishes', icon: UtensilsCrossed },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
    { id: 'reports', label: 'Reports & Revenue', icon: BarChart3 },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  const cashierNavItems = [
    { id: 'pos', label: 'POS Terminal', icon: ShoppingCart, highlight: true },
    { id: 'orders', label: 'Live Orders', icon: Receipt },
    { id: 'tables', label: 'Table Status', icon: Grid },
    { id: 'menu', label: 'Menu Catalog', icon: UtensilsCrossed },
  ];

  const navItems = isAdmin ? adminNavItems : cashierNavItems;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {isAdmin ? 'System Modules' : 'Cashier Terminal'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? item.highlight
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/25 font-semibold'
                    : 'bg-slate-800 text-orange-400 border border-slate-700/80 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? (item.highlight ? 'text-white' : 'text-orange-400') : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>

              {item.highlight && !isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 m-3 bg-slate-800/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
          <span className="text-base">⚡</span>
          <span>Offline Ready</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Local database active. Zero internet needed for sales & receipt printing.
        </p>
      </div>
    </aside>
  );
}
