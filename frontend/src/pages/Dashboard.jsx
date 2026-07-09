import React, { useState, useEffect, useRef } from 'react';
import OrderTable from '../components/OrderTable';
import RiskChart from '../components/RiskChart';
import { 
  ShieldAlert, 
  DollarSign, 
  Percent, 
  Layers, 
  RefreshCw, 
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  Bell,
  Trash2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, PAID, FLAGGED, FAILED
  const [loading, setLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [toast, setToast] = useState(null);

  const pollIntervalRef = useRef(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = async () => {
    try {
      const ordersRes = await fetch(`${API_BASE_URL}/api/orders`);
      if (!ordersRes.ok) throw new Error('Failed to fetch orders');
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      const alertsRes = await fetch(`${API_BASE_URL}/api/orders/reconciliation/alerts`);
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    }
  };

  // Run initial fetch and configure interval
  useEffect(() => {
    fetchData();

    if (autoPoll) {
      pollIntervalRef.current = setInterval(fetchData, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [autoPoll]);

  const handleManualRefresh = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
    showToast('Data refreshed successfully', 'success');
  };

  const handleResolve = async (orderId, action) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to resolve order');
      }

      showToast(`Order #${orderId} has been successfully ${action === 'APPROVE' ? 'Approved' : 'Rejected'}.`, 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/reconciliation/clear`, {
        method: 'POST'
      });
      if (res.ok) {
        setAlerts([]);
        showToast('Reconciliation alerts cleared', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stats Calculations
  const totalVolumePaise = orders
    .filter(o => o.status === 'PAID')
    .reduce((sum, o) => sum + o.amount, 0);
  const totalVolume = totalVolumePaise / 100;

  const totalTransactions = orders.length;
  const flaggedCount = orders.filter(o => o.status === 'FLAGGED').count; // wait, filter().length
  const flaggedOrders = orders.filter(o => o.status === 'FLAGGED');
  const flaggedRate = totalTransactions > 0 
    ? ((flaggedOrders.length / totalTransactions) * 100).toFixed(1) 
    : '0.0';

  // Filtered Orders for the table
  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true;
    return order.status === filter;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-2xl p-4 border max-w-sm shadow-2xl backdrop-blur-md animate-slideIn ${
          toast.type === 'success' ? 'bg-green-950/80 border-green-500/50 text-green-200' :
          'bg-red-950/80 border-red-500/50 text-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="text-xs font-semibold">{toast.text}</div>
          </div>
        </div>
      )}

      {/* Top Bar with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Risk Control Room</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time payment audit logs, fraud score mapping and transaction overrides.</p>
        </div>
        <div className="flex items-center space-x-3 self-end md:self-auto">
          {/* Auto Poll Switch */}
          <label className="inline-flex items-center cursor-pointer bg-dark-800/80 border border-gray-800 px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 select-none">
            <input 
              type="checkbox" 
              checked={autoPoll} 
              onChange={() => setAutoPoll(!autoPoll)} 
              className="sr-only peer"
            />
            <div className="w-7 h-4 bg-gray-700 rounded-full peer peer-focus:ring-0 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500 mr-2 relative"></div>
            <span>Auto Refresh (3s)</span>
          </label>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="bg-dark-850 hover:bg-dark-800 border border-gray-700 hover:border-gray-600 p-2.5 rounded-xl font-medium text-sm transition-all"
            title="Manual Sync"
          >
            <RefreshCw className={`h-4 w-4 text-brand-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="bg-dark-800/40 border border-gray-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Processed Volume</span>
            <span className="text-2xl font-black text-white">₹{totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-dark-800/40 border border-gray-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Total Transactions</span>
            <span className="text-2xl font-black text-white">{totalTransactions}</span>
          </div>
          <div className="bg-brand-500/10 border border-brand-500/20 text-brand-400 p-3 rounded-xl">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-dark-800/40 border border-gray-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Fraud Flag Rate</span>
            <span className="text-2xl font-black text-white">{flaggedRate}%</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-dark-800/40 border border-gray-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Reconcile Alerts</span>
            <span className="text-2xl font-black text-white">{alerts.length}</span>
          </div>
          <div className={`${alerts.length > 0 ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 animate-pulse' : 'bg-gray-800/50 text-gray-500'} border p-3 rounded-xl`}>
            <Bell className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Table & Chart, Right is Alerts Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left 3 Columns: Table and Charts */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Recharts Panels */}
          <RiskChart orders={orders} />

          {/* Controls & Table Container */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white">Transaction Risk Registry</h2>
              
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {['ALL', 'PAID', 'FLAGGED', 'FAILED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filter === st
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'bg-dark-800/60 text-gray-400 border border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <OrderTable 
              orders={filteredOrders} 
              onResolve={handleResolve} 
              loading={loading} 
            />
          </div>
        </div>

        {/* Right 1 Column: Reconciliation Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <span>Reconciliation Alert Panel</span>
            </h2>
            {alerts.length > 0 && (
              <button 
                onClick={handleClearAlerts}
                className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                title="Dismiss Alerts"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="bg-dark-800/35 border border-gray-800/75 rounded-2xl p-6 text-center text-gray-500 text-xs leading-relaxed">
              <ShieldAlert className="h-8 w-8 text-gray-700 mx-auto mb-2" />
              <span>All payment channels synced. H2 state matches active Razorpay test database perfectly.</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {alerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-lg shadow-amber-950/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 h-full w-1 bg-amber-500"></div>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-bold text-amber-300">Local Order #{alert.orderId} Mismatch</div>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{alert.alertMessage}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 font-mono">
                    <span>RazorID: {alert.razorpayOrderId}</span>
                    <span>{new Date(alert.detectedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
