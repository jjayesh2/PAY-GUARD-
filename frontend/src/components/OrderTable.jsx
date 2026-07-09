import React from 'react';
import { CheckCircle2, XCircle, AlertOctagon, Clock, User, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

const PRODUCT_NAMES = {
  'prod_sub': 'Premium Monthly Subscription',
  'prod_dev': 'Developer Pro Pack',
  'prod_ent': 'Enterprise API Access'
};

export default function OrderTable({ orders, onResolve, loading }) {

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            PAID
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            <AlertOctagon className="h-3 w-3 mr-1" />
            FLAGGED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            FAILED
          </span>
        );
      case 'ATTEMPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            ATTEMPTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            CREATED
          </span>
        );
    }
  };

  const getRiskScoreBadge = (score) => {
    if (score === 0) return <span className="text-gray-500 font-semibold">0</span>;
    if (score <= 30) return <span className="text-green-400 font-bold">{score}</span>;
    if (score <= 70) return <span className="text-yellow-400 font-bold">{score}</span>;
    return <span className="text-red-400 font-black text-base">{score}</span>;
  };

  const formatAmount = (paise) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  if (orders.length === 0) {
    return (
      <div className="bg-dark-800/40 border border-gray-800/60 rounded-2xl p-12 text-center text-gray-400">
        <ShieldCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="font-medium text-lg text-gray-300">No transactions recorded yet</p>
        <p className="text-sm text-gray-500 mt-1">Go to the Checkout tab to simulate a transaction.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-850 bg-dark-800/45 backdrop-blur-md">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider bg-dark-950/30">
            <th className="py-4 px-5">ID</th>
            <th className="py-4 px-5">Product Details</th>
            <th className="py-4 px-5">Customer ID & IP</th>
            <th className="py-4 px-5">Timestamp</th>
            <th className="py-4 px-5">Status</th>
            <th className="py-4 px-5">Risk Score</th>
            <th className="py-4 px-5">Risk Trigger Details</th>
            <th className="py-4 px-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50 text-sm">
          {orders.map((order) => {
            // Row styling based on status
            let rowClass = 'hover:bg-dark-800/30 transition-colors';
            if (order.status === 'PAID') rowClass = 'bg-green-950/5 hover:bg-green-950/10 transition-colors';
            else if (order.status === 'FLAGGED') rowClass = 'bg-red-950/10 hover:bg-red-950/15 transition-colors border-l-2 border-l-red-500';
            else if (order.status === 'FAILED') rowClass = 'bg-gray-950/20 hover:bg-gray-950/25 transition-colors';

            return (
              <tr key={order.id} className={rowClass}>
                <td className="py-4 px-5 font-mono text-gray-400 text-xs">#{order.id}</td>
                <td className="py-4 px-5">
                  <div className="font-bold text-white text-sm">
                    {PRODUCT_NAMES[order.productId] || order.productId}
                  </div>
                  <div className="text-brand-400 font-extrabold text-xs mt-0.5">
                    {formatAmount(order.amount)}
                  </div>
                  <div className="text-gray-500 text-[10px] font-mono mt-1">
                    PayID: {order.razorpayPaymentId || 'N/A'}
                  </div>
                </td>
                <td className="py-4 px-5 space-y-1">
                  <div className="flex items-center space-x-1 text-gray-300 font-medium">
                    <User className="h-3 w-3 text-gray-500" />
                    <span className="truncate max-w-[120px]" title={order.customerIdentifier}>{order.customerIdentifier}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{order.ipAddress}</div>
                </td>
                <td className="py-4 px-5 text-xs text-gray-400 whitespace-nowrap">
                  {formatDate(order.createdAt)}
                </td>
                <td className="py-4 px-5">{getStatusBadge(order.status)}</td>
                <td className="py-4 px-5">
                  <div className="flex items-center space-x-2">
                    <div className="w-12 bg-dark-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          order.riskScore > 70 ? 'bg-red-500' : order.riskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(order.riskScore, 100)}%` }}
                      ></div>
                    </div>
                    {getRiskScoreBadge(order.riskScore)}
                  </div>
                </td>
                <td className="py-4 px-5 max-w-[200px]">
                  {order.riskReasons ? (
                    <div className="flex items-start space-x-1 text-xs text-red-300">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed truncate hover:text-clip hover:overflow-visible hover:whitespace-normal" title={order.riskReasons}>{order.riskReasons}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">No risk indicators</span>
                  )}
                </td>
                <td className="py-4 px-5 text-right whitespace-nowrap">
                  {order.status === 'FLAGGED' ? (
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onResolve(order.id, 'APPROVE')}
                        disabled={loading}
                        className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold border border-green-500/30 hover:border-green-500 transition-all flex items-center"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onResolve(order.id, 'REJECT')}
                        disabled={loading}
                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-500/30 hover:border-red-500 transition-all flex items-center"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600 font-semibold">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
