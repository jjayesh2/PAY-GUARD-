import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function RiskChart({ orders }) {
  // Aggregate data for the chart: Group PAID vs FLAGGED by time
  const getChartData = () => {
    const dataMap = {};

    // Sort orders chronological first
    const sortedOrders = [...orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedOrders.forEach((order) => {
      if (order.status !== 'PAID' && order.status !== 'FLAGGED') return;

      const date = new Date(order.createdAt);
      // Group by hours and minutes (e.g., "11:24")
      const timeLabel = date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      if (!dataMap[timeLabel]) {
        dataMap[timeLabel] = { time: timeLabel, Paid: 0, Flagged: 0 };
      }

      if (order.status === 'PAID') {
        dataMap[timeLabel].Paid += 1;
      } else if (order.status === 'FLAGGED') {
        dataMap[timeLabel].Flagged += 1;
      }
    });

    const list = Object.values(dataMap);
    // If empty, return dummy baseline data so chart renders something nice
    if (list.length === 0) {
      return [
        { time: '00:00', Paid: 0, Flagged: 0 },
        { time: '06:00', Paid: 0, Flagged: 0 },
        { time: '12:00', Paid: 0, Flagged: 0 },
        { time: '18:00', Paid: 0, Flagged: 0 }
      ];
    }
    return list;
  };

  const chartData = getChartData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-gray-700 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-xs text-gray-400 font-bold mb-1.5 font-mono">Time: {label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-semibold" style={{ color: entry.color }}>
              {entry.name}: <span className="font-extrabold text-sm">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Area Chart: Transactions Over Time */}
      <div className="bg-dark-800/40 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white text-sm">Volume Trend</h3>
          <p className="text-xs text-gray-500">Paid vs Flagged transactions timeline</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e2238" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#4b5563" fontSize={10} fontClassName="font-mono" />
              <YAxis stroke="#4b5563" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Area name="Paid" type="monotone" dataKey="Paid" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPaid)" />
              <Area name="Flagged" type="monotone" dataKey="Flagged" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFlagged)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Comparison */}
      <div className="bg-dark-800/40 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white text-sm">Hourly Distribution</h3>
          <p className="text-xs text-gray-500">Comparative breakdown of transaction state</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="#1e2238" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#4b5563" fontSize={10} fontClassName="font-mono" />
              <YAxis stroke="#4b5563" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Bar name="Paid" dataKey="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar name="Flagged" dataKey="Flagged" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
