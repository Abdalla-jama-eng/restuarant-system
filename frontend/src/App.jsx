import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginView from './views/LoginView';
import POSView from './views/POSView';
import DashboardView from './views/DashboardView';
import OrdersView from './views/OrdersView';
import TablesView from './views/TablesView';
import MenuView from './views/MenuView';
import InventoryView from './views/InventoryView';
import ReportsView from './views/ReportsView';
import UsersView from './views/UsersView';
import SettingsView from './views/SettingsView';

export default function App() {
  const { user, isAuthenticated, loading, isAdmin, isCashier } = useAuth();
  const [activeTab, setActiveTab] = useState('pos');

  useEffect(() => {
    if (isCashier) {
      setActiveTab('pos');
    } else if (isAdmin) {
      setActiveTab('dashboard');
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 animate-spin flex items-center justify-center text-2xl shadow-xl">
          🍳
        </div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
          Initializing BiteFlow POS...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Role Guard: if a cashier tries to open admin tabs, fallback to POS
  const renderView = () => {
    switch (activeTab) {
      case 'pos':
        return <POSView />;
      case 'dashboard':
        return isAdmin ? <DashboardView setActiveTab={setActiveTab} /> : <POSView />;
      case 'orders':
        return <OrdersView />;
      case 'tables':
        return <TablesView setActiveTab={setActiveTab} />;
      case 'menu':
        return <MenuView />;
      case 'inventory':
        return isAdmin ? <InventoryView /> : <POSView />;
      case 'reports':
        return isAdmin ? <ReportsView /> : <POSView />;
      case 'users':
        return isAdmin ? <UsersView /> : <POSView />;
      case 'settings':
        return isAdmin ? <SettingsView /> : <POSView />;
      default:
        return <POSView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 antialiased overflow-hidden">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic View Area */}
        <main className="flex-1 bg-slate-950 overflow-hidden relative">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
