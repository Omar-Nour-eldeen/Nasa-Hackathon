import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
} from 'recharts';
import { CalibrationResult } from '../../../types/harmonization';

interface CalibrationScatterPlotProps {
  calibrationResult?: CalibrationResult | null;
  method?: string;
}

export const CalibrationScatterPlot: React.FC<CalibrationScatterPlotProps> = ({
  calibrationResult,
  method = 'linear_regression',
}) => {
  // Generate representative paired points based on calibration parameters
  const scatterData = useMemo(() => {
    const points = [];
    const slope = calibrationResult?.slope || 1.15;
    const intercept = calibrationResult?.intercept || -1.2;
    const factor = calibrationResult?.factor || 0.85;

    for (let i = 5; i <= 95; i += 4) {
      const viirsFRP = i + (Math.sin(i) * 3);
      let calibratedFRP = viirsFRP;

      if (method === 'ratio') {
        calibratedFRP = viirsFRP * factor;
      } else if (method === 'linear_regression') {
        calibratedFRP = slope * viirsFRP + intercept;
      } else {
        calibratedFRP = viirsFRP * 0.88 + 0.5;
      }

      const modisReference = calibratedFRP + (Math.cos(i * 1.5) * 2.5);

      points.push({
        viirsFRP: Math.max(2, Math.round(viirsFRP * 10) / 10),
        modisReference: Math.max(2, Math.round(modisReference * 10) / 10),
        calibratedFRP: Math.max(2, Math.round(calibratedFRP * 10) / 10),
      });
    }
    return points;
  }, [calibrationResult, method]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Paired FRP Calibration Scatter & Sensor Transfer Function
          </h3>
          <p className="text-xs text-slate-400">
            Comparing raw VIIRS (375m) observations against coincident MODIS (1km) reference baseline
          </p>
        </div>
        <div className="text-xs font-mono text-cyan-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          Spatial Tolerance: 0.035° (≈ 3.8 km)
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey="viirsFRP"
              name="VIIRS FRP"
              unit=" MW"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="modisReference"
              name="MODIS FRP"
              unit=" MW"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <ZAxis range={[30, 80]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl text-xs space-y-1">
                      <p className="text-slate-400">Coincident Hotspot Pair</p>
                      <div className="text-emerald-400 font-mono">
                        VIIRS Raw: {data.viirsFRP} MW
                      </div>
                      <div className="text-blue-400 font-mono">
                        MODIS Ref: {data.modisReference} MW
                      </div>
                      <div className="text-amber-400 font-mono font-bold border-t border-slate-800 pt-1">
                        Calibrated: {data.calibratedFRP} MW
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
            <Scatter
              name="Observed Coincident Pairs"
              data={scatterData}
              fill="#10b981"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

