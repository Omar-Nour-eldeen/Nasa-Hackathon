import React from 'react';
import { CalibrationMethod, CalibrationResult } from '../../../types/harmonization';
import { Button } from '../../../components/ui/Button';
import { Play, CheckCircle2, Cpu, BarChart } from 'lucide-react';

interface CalibrationCardProps {
  method: CalibrationMethod;
  isSelected: boolean;
  onSelect: () => void;
  onRun: () => void;
  isRunning: boolean;
  activeResult?: CalibrationResult | null;
}

export const CalibrationCard: React.FC<CalibrationCardProps> = ({
  method,
  isSelected,
  onSelect,
  onRun,
  isRunning,
  activeResult,
}) => {
  const getFormula = (id: string) => {
    switch (id) {
      case 'ratio':
        return 'FRP_calibrated = FRP_VIIRS × (μ_MODIS / μ_VIIRS)';
      case 'linear_regression':
        return 'FRP_calibrated = β₁ × FRP_VIIRS + β₀';
      case 'quantile_mapping':
        return 'FRP_calibrated = F_MODIS⁻¹ ( F_VIIRS(FRP_VIIRS) )';
      case 'random_forest':
        return 'FRP_calibrated = Ensemble(Trees, FRP_VIIRS, Spatial_Cluster)';
      default:
        return '';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-xl border p-4.5 transition-all cursor-pointer ${
        isSelected
          ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/10'
          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              isSelected ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide">{method.name}</h4>
            <span className="text-[10px] font-mono text-amber-400/90">{method.id}</span>
          </div>
        </div>

        {isSelected && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
            <CheckCircle2 className="w-3 h-3" /> Active Model
          </span>
        )}
      </div>

      <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">{method.description}</p>

      {/* Mathematical Formulation */}
      <div className="mt-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] text-cyan-300">
        {getFormula(method.id)}
      </div>

      {isSelected && (
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {activeResult ? 'Calibration Fitted' : 'Ready to calibrate'}
          </span>
          <Button
            size="sm"
            variant="primary"
            icon={Play}
            onClick={(e) => {
              e.stopPropagation();
              onRun();
            }}
            loading={isRunning}
          >
            Fit & Calibrate Database
          </Button>
        </div>
      )}
    </div>
  );
};

