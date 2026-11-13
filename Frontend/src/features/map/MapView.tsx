import React, { useState, useEffect } from 'react';
import { FireMap } from './components/FireMap';
import { BoundingBoxControl } from './components/BoundingBoxControl';
import { observationService } from '../../services/observationService';
import { harmonizationService, DiscoveredRegion } from '../../services/harmonizationService';
import { Observation, MapHotspot } from '../../types/fire';
import { PRESET_REGIONS, BoundingBox, exportArrayToCsvFile } from '../../utils/geoUtils';
import { formatNumber, formatFrp, formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  MapPin,
  Filter,
  Flame,
  RefreshCw,
  Compass,
  Layers,
  Radio,
  Globe,
} from 'lucide-react';

export const MapView: React.FC = () => {
  const [hotspots, setHotspots] = useState<Observation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [discoveredRegions, setDiscoveredRegions] = useState<DiscoveredRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('Algeria');
  const [bbox, setBbox] = useState<BoundingBox>(PRESET_REGIONS.ALGERIA ? PRESET_REGIONS.ALGERIA.bbox : { minLat: 19.0, maxLat: 37.5, minLon: -8.5, maxLon: 12.0 });
  const [center, setCenter] = useState<[number, number]>(PRESET_REGIONS.ALGERIA ? PRESET_REGIONS.ALGERIA.center : [28.5, 3.0]);
  const [zoom, setZoom] = useState<number>(PRESET_REGIONS.ALGERIA ? PRESET_REGIONS.ALGERIA.zoom : 5);
  const [activeTileLayer, setActiveTileLayer] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [sensorFilter, setSensorFilter] = useState<string>('ALL');
  const [minFrp, setMinFrp] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<'raw' | 'harmonized'>('raw');
  const [selectedHotspot, setSelectedHotspot] = useState<Observation | null>(null);

  const fetchHotspots = async (appliedBbox?: BoundingBox, regionName?: string) => {
    setLoading(true);
    try {
      const targetBbox = appliedBbox || bbox;
      const targetRegion = regionName !== undefined ? regionName : selectedRegion;

      const data = await observationService.getMapObservations({
        region: targetRegion !== 'ALL' ? targetRegion : undefined,
        min_lat: targetRegion === 'ALL' ? undefined : targetBbox.minLat,
        max_lat: targetRegion === 'ALL' ? undefined : targetBbox.maxLat,
        min_lon: targetRegion === 'ALL' ? undefined : targetBbox.minLon,
        max_lon: targetRegion === 'ALL' ? undefined : targetBbox.maxLon,
        sensor: sensorFilter !== 'ALL' ? sensorFilter : undefined,
        min_frp: minFrp > 0 ? minFrp : undefined,
        limit: 2500,
      });

      setHotspots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching map hotspots', err);
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-discover all uploaded datasets/regions
    const loadDiscoveredRegions = async () => {
      try {
        const regions = await harmonizationService.getDiscoveredRegions();
        setDiscoveredRegions(regions || []);
      } catch (e) {
        console.warn('Could not load discovered regions', e);
      }
    };

    loadDiscoveredRegions();
    fetchHotspots();
  }, []);

  const handleRegionChange = (regName: string) => {
    setSelectedRegion(regName);
    if (regName === 'ALL') {
      const globalCenter: [number, number] = [28.0, 15.0];
      const globalZoom = 3;
      const globalBbox: BoundingBox = { minLat: -60, maxLat: 70, minLon: -180, maxLon: 180 };
      setBbox(globalBbox);
      setCenter(globalCenter);
      setZoom(globalZoom);
      fetchHotspots(globalBbox, 'ALL');
    } else {
      const reg = discoveredRegions.find((r) => r.name.toLowerCase() === regName.toLowerCase());
      if (reg) {
        const newBbox: BoundingBox = {
          minLat: reg.min_lat,
          maxLat: reg.max_lat,
          minLon: reg.min_lon,
          maxLon: reg.max_lon,
        };
        const newCenter: [number, number] = [
          (reg.min_lat + reg.max_lat) / 2,
          (reg.min_lon + reg.max_lon) / 2,
        ];
        const latSpan = reg.max_lat - reg.min_lat;
        const newZoom = latSpan < 4 ? 7 : latSpan < 10 ? 6 : 5;
        setBbox(newBbox);
        setCenter(newCenter);
        setZoom(newZoom);
        fetchHotspots(newBbox, reg.name);
      } else {
        fetchHotspots(bbox, regName);
      }
    }
  };

  const handleSelectPreset = (key: string) => {
    const preset = PRESET_REGIONS[key];
    if (preset) {
      setBbox(preset.bbox);
      setCenter(preset.center);
      setZoom(preset.zoom);
      fetchHotspots(preset.bbox);
    }
  };

  const handleDownloadCsv = () => {
    if (!hotspots || hotspots.length === 0) return;
    exportArrayToCsvFile('pyroscope_aoi_hotspots.csv', hotspots as unknown as Record<string, unknown>[]);
  };

  // Filter local hotspots based on UI toggles safely
  const filteredHotspots = (hotspots || []).filter((h) => {
    if (!h) return false;
    if (sensorFilter !== 'ALL' && (h.sensor || '').toUpperCase() !== sensorFilter.toUpperCase()) {
      return false;
    }
    if (minFrp > 0 && (h.frp || 0) < minFrp) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MapPin className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Active Geospatial Fire Explorer
                <span className="text-[10px] font-semibold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live FIRMS Stream
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                High-performance active fire thermal anomaly mapping across MODIS (1km) & VIIRS (375m)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Display Mode: Raw vs Harmonized Continuity */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs shadow-lg">
            <button
              onClick={() => setDisplayMode('raw')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'raw'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Display native observed Radiant Heat as detected by sensor"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              Raw Sensor FRP
            </button>
            <button
              onClick={() => setDisplayMode('harmonized')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'harmonized'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Scale VIIRS 375m radiant energy to match 20-year MODIS 1km benchmark"
            >
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              ⚡ Harmonized (MODIS 1km Scaled)
            </button>
          </div>

          {/* Base Tile Layer Switcher */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs shadow-lg">
            <button
              onClick={() => setActiveTileLayer('dark')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTileLayer === 'dark'
                  ? 'bg-slate-800 text-amber-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Matter
            </button>
            <button
              onClick={() => setActiveTileLayer('satellite')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTileLayer === 'satellite'
                  ? 'bg-slate-800 text-amber-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite Imagery
            </button>
            <button
              onClick={() => setActiveTileLayer('streets')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTileLayer === 'streets'
                  ? 'bg-slate-800 text-amber-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Topographic
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchHotspots()}
            loading={loading}
          >
            Refresh Stream
          </Button>
        </div>
      </div>

      {/* Sensor & FRP Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4">
          {/* Active Dataset / Region Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> Active Dataset:
            </span>
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 hover:border-amber-500 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="ALL">🌍 All Uploaded Regions (Global)</option>
              {discoveredRegions.map((reg) => (
                <option key={reg.name} value={reg.name}>
                  📍 {reg.name} ({formatNumber(reg.total_obs)} hotspots)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-500" /> Sensor:
            </span>
            <div className="flex gap-1.5">
              {['ALL', 'MODIS', 'VIIRS'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSensorFilter(s)}
                  className={`px-2.5 py-1 rounded font-semibold border transition-all cursor-pointer ${
                    sensorFilter === s
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Min FRP:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={minFrp}
            onChange={(e) => setMinFrp(Number(e.target.value))}
            className="w-28 accent-amber-500 cursor-pointer"
          />
          <span className="font-mono text-amber-400 font-bold">{minFrp} MW</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-md border border-cyan-500/30">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span className="text-cyan-300 font-semibold">MODIS (1km)</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-md border border-emerald-500/30">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-emerald-300 font-semibold">VIIRS (375m)</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-md border border-amber-500/30">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            <span className="text-amber-300 font-semibold">Elevated (&gt; 45 MW)</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-md border border-red-500/30">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span className="text-red-400 font-semibold">Extreme Wildfire (&gt; 80 MW)</span>
          </span>
          <span className="text-slate-400 font-semibold font-mono ml-1">
            ({formatNumber(filteredHotspots.length)} Active)
          </span>
        </div>
      </div>

      {/* Main Map & Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Active Leaflet Map */}
        <div className="lg:col-span-3">
          <FireMap
            hotspots={filteredHotspots}
            center={center}
            zoom={zoom}
            activeTileLayer={activeTileLayer}
            displayMode={displayMode}
            onSelectHotspot={(h) => setSelectedHotspot(h as Observation)}
          />
        </div>

        {/* Selected Hotspot Telemetry Inspector */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" /> Hotspot Telemetry
              </span>
              {selectedHotspot && (
                <div className="flex items-center gap-1.5">
                  <Badge variant={selectedHotspot.sensor?.toUpperCase() === 'VIIRS' ? 'viirs' : 'modis'}>
                    {selectedHotspot.sensor}
                  </Badge>
                  {selectedHotspot.harmonized_frp !== undefined && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                      Harmonized
                    </span>
                  )}
                </div>
              )}
            </div>

            {selectedHotspot ? (
              <div className="space-y-3 text-xs">
                {/* Dynamic Fire Classification Banner */}
                {(() => {
                  const effectiveFrp = displayMode === 'harmonized'
                    ? (selectedHotspot.harmonized_frp ?? selectedHotspot.frp ?? 0)
                    : (selectedHotspot.frp || 0);
                  const isViirs = (selectedHotspot.sensor || '').toUpperCase() === 'VIIRS';

                  if (effectiveFrp > 80) {
                    return (
                      <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/50 text-red-200 space-y-1">
                        <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px] uppercase">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                          Extreme Wildfire (FRP &gt; 80 MW)
                        </div>
                        <p className="text-[10px] text-red-300/80 leading-tight">
                          Severe crown wildfire behavior or high-energy biomass combustion front.
                        </p>
                      </div>
                    );
                  }
                  if (effectiveFrp > 45) {
                    return (
                      <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-500/50 text-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          Elevated Intensity (FRP &gt; 45 MW)
                        </div>
                        <p className="text-[10px] text-amber-300/80 leading-tight">
                          Intense active surface flaming front with high radiant energy.
                        </p>
                      </div>
                    );
                  }
                  if (isViirs) {
                    return (
                      <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          VIIRS 375m High-Resolution
                        </div>
                        <p className="text-[10px] text-emerald-300/80 leading-tight">
                          {displayMode === 'harmonized'
                            ? 'Scaled to 1km MODIS baseline to prevent multi-sensor bias in time-series.'
                            : 'Detailed 375m I-band active fire observation with sharp perimeter detail.'}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="p-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/50 text-cyan-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] uppercase">
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        MODIS 1km Historical Baseline
                      </div>
                      <p className="text-[10px] text-cyan-300/80 leading-tight">
                        Calibrated multi-decadal observation from Terra / Aqua satellites.
                      </p>
                    </div>
                  );
                })()}

                {/* Side-by-Side FRP: Native Raw vs Harmonized Baseline */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Native Raw FRP
                    </span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      {formatFrp(selectedHotspot.frp)}
                    </span>
                    <span className="text-[9px] text-slate-500 block">Sensor measured</span>
                  </div>

                  <div className="border-l border-slate-800 pl-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Harmonized FRP
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      {formatFrp(selectedHotspot.harmonized_frp ?? selectedHotspot.frp)}
                    </span>
                    <span className="text-[9px] text-emerald-500/90 font-mono block">
                      {selectedHotspot.harmonized_frp !== undefined
                        ? `${(selectedHotspot.harmonized_frp - (selectedHotspot.frp || 0)) >= 0 ? '+' : ''}${(selectedHotspot.harmonized_frp - (selectedHotspot.frp || 0)).toFixed(1)} MW Scaled`
                        : 'Baseline 1:1'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Acquired Date:</span>
                    <span className="text-slate-200 font-medium">
                      {formatDate(selectedHotspot.acq_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Confidence:</span>
                    <span className="text-emerald-400 font-medium capitalize">
                      {selectedHotspot.confidence || 'Nominal'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2">
                  <div>
                    <span className="text-slate-500 block">Latitude:</span>
                    <span className="text-slate-200 font-mono">
                      {selectedHotspot.latitude?.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Longitude:</span>
                    <span className="text-slate-200 font-mono">
                      {selectedHotspot.longitude?.toFixed(4)}
                    </span>
                  </div>
                </div>

                {selectedHotspot.brightness && (
                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-slate-500 block">Brightness Temperature:</span>
                    <span className="text-slate-200 font-mono">
                      {selectedHotspot.brightness.toFixed(1)} K
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <Compass className="w-8 h-8 mx-auto text-slate-700 animate-pulse" />
                <p>Click any active fire hotspot circle on the map to inspect radiant thermal telemetry.</p>
              </div>
            )}
          </div>

          {/* Quick Regime Classification Guide */}
          <div className="pt-3 border-t border-slate-800 space-y-2 mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Classification Guide
            </span>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-cyan-300 bg-slate-950/60 px-2 py-1.5 rounded border border-cyan-500/20">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" /> MODIS (1 km)
                </span>
                <span className="text-slate-400 text-[9px]">FRP ≤ 45 MW</span>
              </div>
              <div className="flex items-center justify-between text-emerald-300 bg-slate-950/60 px-2 py-1.5 rounded border border-emerald-500/20">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> VIIRS (375 m)
                </span>
                <span className="text-slate-400 text-[9px]">FRP ≤ 45 MW</span>
              </div>
              <div className="flex items-center justify-between text-amber-300 bg-slate-950/60 px-2 py-1.5 rounded border border-amber-500/20">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" /> Elevated Intensity
                </span>
                <span className="text-amber-400 font-bold text-[9px]">FRP &gt; 45 MW</span>
              </div>
              <div className="flex items-center justify-between text-red-300 bg-slate-950/60 px-2 py-1.5 rounded border border-red-500/20">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" /> Extreme Wildfire
                </span>
                <span className="text-red-400 font-bold text-[9px]">FRP &gt; 80 MW</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bounding Box AOI Controls */}
      <BoundingBoxControl
        bbox={bbox}
        onChangeBbox={setBbox}
        onApplyFilter={() => fetchHotspots(bbox)}
        onSelectPreset={handleSelectPreset}
        onDownloadCsv={handleDownloadCsv}
        loading={loading}
      />

      {/* Hotspots Data Table Preview */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Current Active Observation Stream ({filteredHotspots.length} hotspots)
          </h3>
          <span className="text-xs text-slate-400">Showing latest records</span>
        </div>

        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950/80 sticky top-0 text-[11px] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-2">Sensor</th>
                <th className="p-2">Coordinates</th>
                <th className="p-2">Raw FRP</th>
                <th className="p-2">Harmonized FRP</th>
                <th className="p-2">Acq Date</th>
                <th className="p-2">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredHotspots.slice(0, 15).map((h, i) => (
                <tr key={h.id || i} className="hover:bg-slate-800/20">
                  <td className="p-2">
                    <Badge variant={h.sensor?.toUpperCase() === 'VIIRS' ? 'viirs' : 'modis'}>
                      {h.sensor}
                    </Badge>
                  </td>
                  <td className="p-2 font-mono text-slate-400">
                    {h.latitude?.toFixed(3)}, {h.longitude?.toFixed(3)}
                  </td>
                  <td className="p-2 font-mono font-bold text-amber-400">
                    {formatFrp(h.frp)}
                  </td>
                  <td className="p-2 font-mono font-bold text-emerald-400">
                    {formatFrp(h.harmonized_frp ?? h.frp)}
                  </td>
                  <td className="p-2">{formatDate(h.acq_date)}</td>
                  <td className="p-2 text-slate-400 capitalize">{h.confidence || 'Nominal'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
