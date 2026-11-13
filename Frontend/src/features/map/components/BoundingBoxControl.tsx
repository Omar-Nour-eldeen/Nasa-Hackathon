import React from 'react';
import { PRESET_REGIONS, BoundingBox } from '../../../utils/geoUtils';
import { Button } from '../../../components/ui/Button';
import { MapPin, Compass, Search, Download } from 'lucide-react';

interface BoundingBoxControlProps {
  bbox: BoundingBox;
  onChangeBbox: (newBbox: BoundingBox) => void;
  onApplyFilter: () => void;
  onSelectPreset: (key: string) => void;
  onDownloadCsv?: () => void;
  loading?: boolean;
}

export const BoundingBoxControl: React.FC<BoundingBoxControlProps> = ({
  bbox,
  onChangeBbox,
  onApplyFilter,
  onSelectPreset,
  onDownloadCsv,
  loading = false,
}) => {
  const handleChange = (key: keyof BoundingBox, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChangeBbox({
        ...bbox,
        [key]: num,
      });
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Title & Preset Quick Select */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Area of Interest (AOI) & Coordinates
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
          {Object.entries(PRESET_REGIONS).map(([key, data]) => (
            <button
              key={key}
              onClick={() => onSelectPreset(key)}
              className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              {data.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Coordinate Input Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Min Latitude (South)
          </label>
          <input
            type="number"
            step="0.01"
            value={bbox.minLat}
            onChange={(e) => handleChange('minLat', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Max Latitude (North)
          </label>
          <input
            type="number"
            step="0.01"
            value={bbox.maxLat}
            onChange={(e) => handleChange('maxLat', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Min Longitude (West)
          </label>
          <input
            type="number"
            step="0.01"
            value={bbox.minLon}
            onChange={(e) => handleChange('minLon', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Max Longitude (East)
          </label>
          <input
            type="number"
            step="0.01"
            value={bbox.maxLon}
            onChange={(e) => handleChange('maxLon', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-slate-500">
          Filter satellite observations strictly inside this bounding box envelope.
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            icon={Search}
            onClick={onApplyFilter}
            loading={loading}
            className="flex-1 sm:flex-initial"
          >
            Apply BBox Filter
          </Button>

          {onDownloadCsv && (
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={onDownloadCsv}
              className="flex-1 sm:flex-initial"
            >
              Export AOI Hotspots CSV
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

