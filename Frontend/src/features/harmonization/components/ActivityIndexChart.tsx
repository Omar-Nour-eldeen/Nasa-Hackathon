import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ActivityIndexPoint } from '../../../types/harmonization';
import { formatDate, formatNumber } from '../../../utils/formatters';

interface ActivityIndexChartProps {
  activityData: ActivityIndexPoint[];
}

export const ActivityIndexChart: React.FC<ActivityIndexChartProps> = ({ activityData }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Harmonized Burning Activity Index (HAI) Over Time
          </h3>
          <p className="text-xs text-slate-400">
            Composite index merging sensor-invariant hotspot count (40%) and calibrated radiative power (60%)
          </p>
        </div>
        <div className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
          Sensor Invariant Metric
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="haiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="acq_date"
              stroke="#64748b"
              tickFormatter={(d) => formatDate(d).split(',')[0]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ActivityIndexPoint;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl text-xs space-y-1">
                      <p className="font-semibold text-white border-b border-slate-800 pb-1">
                        {formatDate(String(label))}
                      </p>
                      <div className="flex justify-between gap-4 text-amber-400 font-bold">
                        <span>HAI Index:</span>
                        <span className="font-mono">
                          {data.harmonized_activity_index?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Total Hotspots:</span>
                        <span className="font-mono">{formatNumber(data.total_hotspots)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-400">
                        <span>Mean FRP:</span>
                        <span className="font-mono">{data.mean_frp?.toFixed(1)} MW</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
              formatter={(value) => <span className="text-slate-300">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="harmonized_activity_index"
              name="Harmonized Activity Index"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#haiGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
