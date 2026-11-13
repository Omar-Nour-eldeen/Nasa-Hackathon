import React from 'react';
import { COLOR_RAMPS, ColorRampType } from '../../../utils/colorRamps';
import { Palette, Eye } from 'lucide-react';

interface ColorRampSelectorProps {
  currentRamp: ColorRampType;
  onChangeRamp: (ramp: ColorRampType) => void;
}

export const ColorRampSelector: React.FC<ColorRampSelectorProps> = ({
  currentRamp,
  onChangeRamp,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Accessibility Color Ramp:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {COLOR_RAMPS.map((ramp) => {
          const isSelected = currentRamp === ramp.id;
          return (
            <button
              key={ramp.id}
              onClick={() => onChangeRamp(ramp.id)}
              title={ramp.description}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-amber-500 text-white shadow-xs shadow-amber-500/20'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex h-3 w-14 rounded-xs overflow-hidden border border-slate-700/60 shadow-xs">
                {ramp.preview.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span>{ramp.name.split(' ')[0]}</span>
              {isSelected && <Eye className="w-3 h-3 text-amber-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

