import React, { useState } from 'react';
import { LogIn, Shield, User, Lock, Store, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginView() {
  const { login } = useAuth();
  const { error, success } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      error('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      const user = await login(username, password);
      success(`Welcome back, ${user.name} (${user.role.toUpperCase()})`);
    } catch (err) {
      error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickUser = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/30 text-3xl">
            🍳
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            BiteFlow Restaurant POS
          </h1>
          <p className="text-sm text-slate-400">
            Offline Restaurant Management & Billing System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-11 pr-4 py-3 bg-slate-850 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In to System'}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
              <span>Quick Login Profiles:</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setQuickUser('admin', 'admin123')}
                className={`p-3 rounded-xl border text-left transition ${
                  username === 'admin'
                    ? 'bg-purple-500/15 border-purple-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Admin
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => setQuickUser('cashier1', 'cashier123')}
                className={`p-3 rounded-xl border text-left transition ${
                  username === 'cashier1'
                    ? 'bg-orange-500/15 border-orange-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Cashier
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">cashier1 / cashier123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Offline Badge */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Standalone local database engine (MongoDB Local)
        </div>
      </div>
    </div>
  );
}
