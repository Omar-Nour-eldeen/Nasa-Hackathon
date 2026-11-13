import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { AlertTriangle, Play, Sliders, ShieldAlert } from 'lucide-react';

interface AnomalyDetectorControlProps {
  onRunDetection: (threshold: number) => Promise<void>;
  loading?: boolean;
}

export const AnomalyDetectorControl: React.FC<AnomalyDetectorControlProps> = ({
  onRunDetection,
  loading = false,
}) => {
  const [threshold, setThreshold] = useState<number>(2.5);

  const handleRun = () => {
    onRunDetection(threshold);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Statistical Anomaly & Extreme Fire Intensity Detector
            </h3>
            <p className="text-xs text-slate-400">
              Flags thermal anomalies where Fire Radiative Power (FRP) deviates by Z-scores above historical regional baseline
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Slider */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              Statistical Z-Score Threshold (σ):
            </span>
            <span className="font-mono text-base font-bold text-amber-400">
              {threshold.toFixed(1)} σ
            </span>
          </div>

          <input
            type="range"
            min="1.5"
            max="4.0"
            step="0.1"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1.5 σ (Sensitive: ~87% confidence)</span>
            <span>2.5 σ (Recommended: ~98.8%)</span>
            <span>4.0 σ (Only Catastrophic Extremes)</span>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="flex justify-end">
          <Button
            variant="danger"
            size="md"
            icon={Play}
            onClick={handleRun}
            loading={loading}
            className="w-full md:w-auto"
          >
            Run Anomaly Scan
          </Button>
        </div>
      </div>
    </div>
  );
};

