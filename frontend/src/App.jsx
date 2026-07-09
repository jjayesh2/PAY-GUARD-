import React, { useState } from 'react';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import { ShieldAlert, CreditCard, LayoutDashboard } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('checkout'); // 'checkout' or 'dashboard'

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-dark-900/85 backdrop-blur-md border-b border-gray-800/80 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-2.5">
            <div className="bg-brand-500/10 border border-brand-500/40 p-2 rounded-xl text-brand-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">Pay<span className="text-brand-500">Guard</span></span>
              <span className="text-[10px] text-brand-400 font-bold bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full ml-2">DEMO MODE</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 bg-dark-950/50 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'checkout'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/15'
                  : 'text-gray-400 hover:text-gray-250 hover:bg-dark-800/30'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Checkout Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/15'
                  : 'text-gray-400 hover:text-gray-250 hover:bg-dark-800/30'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Admin Control Room</span>
            </button>
          </div>

          {/* Integration Status (Right side) */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-semibold">Local Audit Node Live</span>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'checkout' ? <Checkout /> : <Dashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 bg-dark-950/20 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            &copy; 2026 PayGuard System Audit Layer. Built for demo and sandbox audits.
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-gray-400 cursor-pointer">Security Protocol</span>
            <span>&middot;</span>
            <span className="hover:text-gray-400 cursor-pointer">API Integration Docs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
