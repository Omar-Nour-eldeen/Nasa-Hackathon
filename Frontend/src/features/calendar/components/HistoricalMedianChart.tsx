import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { CalendarDayData } from '../../../types/fire';
import { formatNumber } from '../../../utils/formatters';

interface HistoricalMedianChartProps {
  calendarData: CalendarDayData[];
  comparisonYear?: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const HistoricalMedianChart: React.FC<HistoricalMedianChartProps> = ({
  calendarData,
  comparisonYear = 2025,
}) => {
  const chartData = useMemo(() => {
    // Group counts by year and month
    const yearlyMonthly: Record<number, Record<number, number>> = {};

    calendarData.forEach((item) => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = d.getMonth();

      if (!yearlyMonthly[y]) yearlyMonthly[y] = {};
      yearlyMonthly[y][m] = (yearlyMonthly[y][m] || 0) + (item.fire_count || 1);
    });

    const detectedYears = Object.keys(yearlyMonthly).map(Number);
    const targetYear = detectedYears.includes(comparisonYear)
      ? comparisonYear
      : Math.max(...detectedYears, 2025);

    // Compute month-by-month historical median, min, max
    return MONTH_LABELS.map((monthName, mIndex) => {
      const historicalValues: number[] = [];
      detectedYears.forEach((y) => {
        // Exclude the current comparison year from baseline to avoid self-bias
        if (y !== targetYear) {
          historicalValues.push(yearlyMonthly[y]?.[mIndex] || 0);
        }
      });

      if (historicalValues.length === 0) {
        // fallback to include target year if only 1 year exists
        historicalValues.push(yearlyMonthly[targetYear]?.[mIndex] || 0);
      }

      historicalValues.sort((a, b) => a - b);
      const minVal = Math.min(...historicalValues);
      const maxVal = Math.max(...historicalValues);
      const medianVal =
        historicalValues.length % 2 === 1
          ? historicalValues[Math.floor(historicalValues.length / 2)]
          : (historicalValues[historicalValues.length / 2 - 1] +
              historicalValues[historicalValues.length / 2]) /
            2;

      const currentYearVal = yearlyMonthly[targetYear]?.[mIndex] || 0;
      const anomalyPercent =
        medianVal > 0 ? ((currentYearVal - medianVal) / medianVal) * 100 : 0;

      return {
        month: monthName,
        currentYear: currentYearVal,
        historicalMedian: Math.round(medianVal),
        historicalMin: minVal,
        historicalMax: maxVal,
        anomalyPercent: Math.round(anomalyPercent),
      };
    });
  }, [calendarData, comparisonYear]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Burning Activity Anomaly: Year {comparisonYear} vs Multi-Year Historical Median
          </h3>
          <p className="text-xs text-slate-400">
            Dashed line represents 20-year baseline median; shaded envelope indicates historical min-max boundaries.
          </p>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="envelopeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5">
                      <p className="font-semibold text-white border-b border-slate-800 pb-1">
                        {label} (Evaluation)
                      </p>
                      <div className="flex justify-between gap-4">
                        <span className="text-amber-400 font-medium">Selected Year:</span>
                        <span className="font-mono text-white font-bold">
                          {formatNumber(data.currentYear)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-cyan-400 font-medium">Historical Median:</span>
                        <span className="font-mono text-slate-300">
                          {formatNumber(data.historicalMedian)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-400">
                        <span>Historical Range:</span>
                        <span className="font-mono">
                          {formatNumber(data.historicalMin)} – {formatNumber(data.historicalMax)}
                        </span>
                      </div>
                      <div className="border-t border-slate-800 pt-1 flex justify-between gap-4">
                        <span className="text-slate-300">Anomaly vs Median:</span>
                        <span
                          className={`font-mono font-bold ${
                            data.anomalyPercent > 0 ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {data.anomalyPercent > 0 ? `+${data.anomalyPercent}%` : `${data.anomalyPercent}%`}
                        </span>
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
              dataKey="historicalMax"
              name="Historical Max Envelope"
              stroke="#38bdf8"
              strokeDasharray="2 2"
              fill="url(#envelopeGradient)"
            />
            <Line
              type="monotone"
              dataKey="historicalMedian"
              name="Historical Median Baseline"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#06b6d4' }}
            />
            <Line
              type="monotone"
              dataKey="currentYear"
              name={`Active Year (${comparisonYear})`}
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, fill: '#f59e0b' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

