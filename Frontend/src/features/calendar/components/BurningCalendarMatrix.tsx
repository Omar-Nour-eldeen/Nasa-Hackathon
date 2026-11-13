import React, { useMemo } from 'react';
import { ColorRampType, getColorForNormalizedValue, getContrastTextColor } from '../../../utils/colorRamps';
import { formatNumber, formatFrp } from '../../../utils/formatters';
import { CalendarDayData } from '../../../types/fire';
import { Flame, AlertCircle } from 'lucide-react';

interface BurningCalendarMatrixProps {
  calendarData: CalendarDayData[];
  selectedRamp: ColorRampType;
  onSelectCell?: (year: number, month: number, count: number, avgFrp: number) => void;
  selectedYear?: number | null;
  selectedMonth?: number | null;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const BurningCalendarMatrix: React.FC<BurningCalendarMatrixProps> = ({
  calendarData,
  selectedRamp,
  onSelectCell,
  selectedYear,
  selectedMonth,
}) => {
  // Aggregate daily records into { year: { month: { count, sumFrp, days } } }
  const { matrix, years, maxMonthCount, monthMedians } = useMemo(() => {
    const agg: Record<number, Record<number, { count: number; sumFrp: number; days: number }>> = {};

    calendarData.forEach((item) => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (isNaN(d.getTime())) return;

      const y = d.getFullYear();
      const m = d.getMonth(); // 0 to 11

      if (!agg[y]) {
        agg[y] = {};
        for (let i = 0; i < 12; i++) {
          agg[y][i] = { count: 0, sumFrp: 0, days: 0 };
        }
      }

      agg[y][m].count += item.fire_count || 1;
      agg[y][m].sumFrp += (item.intensity || 20) * (item.fire_count || 1);
      agg[y][m].days += 1;
    });

    let detectedYears = Object.keys(agg).map(Number).sort((a, b) => b - a);
    if (detectedYears.length === 0) {
      detectedYears = [2026, 2025, 2024, 2023, 2022];
      detectedYears.forEach((y) => {
        agg[y] = {};
        for (let i = 0; i < 12; i++) {
          agg[y][i] = { count: 0, sumFrp: 0, days: 0 };
        }
      });
    }

    let globalMax = 1;
    // Calculate historical median per month for anomaly benchmark
    const monthCountsMap: Record<number, number[]> = {};
    for (let m = 0; m < 12; m++) monthCountsMap[m] = [];

    detectedYears.forEach((y) => {
      for (let m = 0; m < 12; m++) {
        const c = agg[y]?.[m]?.count || 0;
        if (c > globalMax) globalMax = c;
        if (c > 0) monthCountsMap[m].push(c);
      }
    });

    const medians: Record<number, number> = {};
    for (let m = 0; m < 12; m++) {
      const arr = monthCountsMap[m].sort((a, b) => a - b);
      if (arr.length === 0) medians[m] = 0;
      else if (arr.length % 2 === 1) medians[m] = arr[Math.floor(arr.length / 2)];
      else medians[m] = (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2;
    }

    return {
      matrix: agg,
      years: detectedYears,
      maxMonthCount: globalMax,
      monthMedians: medians,
    };
  }, [calendarData]);

  return (
    <div className="space-y-4">
      {/* Matrix Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Year
              </th>
              {MONTH_NAMES.map((name, i) => (
                <th
                  key={name}
                  className="p-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  <div>{name}</div>
                  <div className="text-[10px] text-slate-500 font-mono font-normal">
                    Med: {monthMedians[i] ? formatNumber(monthMedians[i]) : '0'}
                  </div>
                </th>
              ))}
              <th className="p-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/40">
            {years.map((year) => {
              let yearTotal = 0;
              for (let m = 0; m < 12; m++) {
                yearTotal += matrix[year]?.[m]?.count || 0;
              }

              return (
                <tr key={year} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-2.5 font-mono text-xs font-bold text-slate-200">
                    {year}
                  </td>

                  {MONTH_NAMES.map((_, monthIndex) => {
                    const cellData = matrix[year]?.[monthIndex] || { count: 0, sumFrp: 0, days: 0 };
                    const count = cellData.count;
                    const avgFrp = cellData.count > 0 ? cellData.sumFrp / cellData.count : 0;
                    const norm = maxMonthCount > 0 ? count / maxMonthCount : 0;
                    const bgColor = count > 0 ? getColorForNormalizedValue(norm, selectedRamp) : '#0f172a';
                    const textColor = count > 0 ? getContrastTextColor(bgColor) : '#64748b';
                    const median = monthMedians[monthIndex] || 0;
                    const isSevereAnomaly = count > 0 && median > 0 && count >= median * 1.6;

                    const isSelected = selectedYear === year && selectedMonth === monthIndex;

                    return (
                      <td key={monthIndex} className="p-1">
                        <button
                          onClick={() => onSelectCell && onSelectCell(year, monthIndex, count, avgFrp)}
                          className={`group relative w-full h-12 rounded-lg flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
                            isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105 z-10' : 'hover:scale-102 hover:z-5'
                          }`}
                          style={{
                            backgroundColor: bgColor,
                            color: textColor,
                          }}
                          title={`${year} ${MONTH_NAMES[monthIndex]}: ${formatNumber(count)} hotspots detected (Avg FRP: ${formatFrp(avgFrp)})`}
                        >
                          <span className="text-xs font-bold tracking-tight">
                            {count > 0 ? formatNumber(count) : '—'}
                          </span>

                          {avgFrp > 0 && (
                            <span className="text-[9px] opacity-85 font-mono">
                              {avgFrp.toFixed(0)} MW
                            </span>
                          )}

                          {isSevereAnomaly && (
                            <div className="absolute top-1 right-1">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}

                  <td className="p-2.5 text-right font-mono text-xs font-bold text-amber-400">
                    {formatNumber(yearTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Comprehensive Legend & Anomaly Indicator Guide */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          {/* Color Ramp Gauge */}
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wide">Activity Heat:</span>
            <span className="text-[11px] text-slate-400 font-mono">0</span>
            <div className="flex h-3.5 w-40 rounded-md overflow-hidden border border-slate-700 shadow-inner">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-full"
                  style={{
                    backgroundColor: getColorForNormalizedValue((i + 1) / 12, selectedRamp),
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400 font-mono font-bold">Max ({formatNumber(maxMonthCount)})</span>
          </div>

          {/* Anomaly Indicator */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/40 px-2.5 py-1 rounded-lg">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-red-300 font-semibold text-[11px]">
                Severe Anomaly Spike (&gt;1.6× Multi-Year Median)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>FRP: Fire Radiative Power (MW)</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800/60 pt-2">
          <strong>Calendar Methodology:</strong> Colors represent normalized monthly burning density relative to the multi-decadal maximum. The pulsing red dot flags outlier months where fire activity was at least 60% higher than the 20-year baseline median for that specific month, indicating catastrophic fire seasons.
        </p>
      </div>
    </div>
  );
};

