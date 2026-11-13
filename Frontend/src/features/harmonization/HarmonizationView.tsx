import React, { useState, useEffect } from 'react';
import { CalibrationCard } from './components/CalibrationCard';
import { MetricsComparison } from './components/MetricsComparison';
import { CalibrationScatterPlot } from './components/CalibrationScatterPlot';
import { ActivityIndexChart } from './components/ActivityIndexChart';
import {
  harmonizationService,
  CalibrationFilterParams,
  DiscoveredRegion,
} from '../../services/harmonizationService';
import {
  CalibrationMethod,
  CalibrationResult,
  HarmonizationRunRecord,
  ActivityIndexPoint,
  HarmonizationUncertainty,
} from '../../types/harmonization';
import { formatDate, formatNumber } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  GitCompare,
  ShieldCheck,
  History,
  RefreshCw,
  Cpu,
  Layers,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';

export const HarmonizationView: React.FC = () => {
  const [methods, setMethods] = useState<CalibrationMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('linear_regression');
  const [activeResult, setActiveResult] = useState<CalibrationResult | null>(null);
  const [runHistory, setRunHistory] = useState<HarmonizationRunRecord[]>([]);
  const [activityIndex, setActivityIndex] = useState<ActivityIndexPoint[]>([]);
  const [uncertainty, setUncertainty] = useState<HarmonizationUncertainty | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningMethod, setRunningMethod] = useState<boolean>(false);

  // Dynamic Discovered Regions from Uploaded Datasets
  const [discoveredRegions, setDiscoveredRegions] = useState<DiscoveredRegion[]>([]);
  const [selectedScopeId, setSelectedScopeId] = useState<string>('all');
  const [customFilters, setCustomFilters] = useState<CalibrationFilterParams>({
    min_lat: undefined,
    max_lat: undefined,
    min_lon: undefined,
    max_lon: undefined,
    start_date: '',
    end_date: '',
  });

  const [coincidentSummary, setCoincidentSummary] = useState<{
    total_pairs: number;
    avg_modis_frp: number;
    avg_viirs_frp: number;
  }>({ total_pairs: 0, avg_modis_frp: 0, avg_viirs_frp: 0 });

  // Compute active filters based on selection
  const getActiveFilters = (scopeId: string): CalibrationFilterParams => {
    if (scopeId === 'all') return {};
    if (scopeId === 'custom') return customFilters;
    const found = discoveredRegions.find((r) => r.name.toLowerCase() === scopeId.toLowerCase());
    if (found) {
      return {
        region: found.name,
        min_lat: found.min_lat,
        max_lat: found.max_lat,
        min_lon: found.min_lon,
        max_lon: found.max_lon,
      };
    }
    return {};
  };

  const fetchCoincidentSummary = async (filters: CalibrationFilterParams) => {
    try {
      const summary = await harmonizationService.getCoincidentPairs(filters);
      setCoincidentSummary(summary);
    } catch (err) {
      console.error('Failed to query coincident pairs', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [methodsData, historyData, indexData, uncertData, regionsData] = await Promise.all([
        harmonizationService.getMethods(),
        harmonizationService.getResults(),
        harmonizationService.getActivityIndex(),
        harmonizationService.getUncertainty(),
        harmonizationService.getDiscoveredRegions(),
      ]);

      setMethods(methodsData);
      setRunHistory(historyData);
      setActivityIndex(indexData);
      setUncertainty(uncertData);
      setDiscoveredRegions(regionsData);

      const activeFilters = getActiveFilters(selectedScopeId);
      await fetchCoincidentSummary(activeFilters);

      // Pre-populate metrics from latest run if available
      if (historyData.length > 0) {
        const latest = historyData[0];
        setActiveResult({
          metrics: {
            mae: latest.metrics_mae,
            rmse: latest.metrics_rmse,
            bias: latest.metrics_bias,
            correlation: latest.metrics_correlation,
          },
        });
        setSelectedMethodId(latest.method);
      }
    } catch (err) {
      console.error('Failed to load harmonization data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectScope = async (scopeId: string) => {
    setSelectedScopeId(scopeId);
    const targetFilters = getActiveFilters(scopeId);
    await fetchCoincidentSummary(targetFilters);
  };

  const handleRunCalibration = async () => {
    const activeFilters = getActiveFilters(selectedScopeId);
    const selectedRegionObj = discoveredRegions.find((r) => r.name.toLowerCase() === selectedScopeId.toLowerCase());

    // Validation: prevent calibrating on a region with no pairs
    if (selectedRegionObj && !selectedRegionObj.harmonization_ready) {
      alert(`Cannot harmonize "${selectedRegionObj.name}" alone because it only contains a single sensor. Please upload both MODIS and VIIRS files for this region.`);
      return;
    }

    setRunningMethod(true);
    try {
      const runRes = await harmonizationService.runHarmonization(selectedMethodId, activeFilters);
      setActiveResult(runRes.results);
      // Refresh history and activity index
      const [newHistory, newIndex] = await Promise.all([
        harmonizationService.getResults(),
        harmonizationService.getActivityIndex(),
      ]);
      setRunHistory(newHistory);
      setActivityIndex(newIndex);
    } catch (err) {
      console.error('Calibration run failed', err);
    } finally {
      setRunningMethod(false);
    }
  };

  const selectedMethodObj = methods.find((m) => m.id === selectedMethodId);
  const selectedRegionObj = discoveredRegions.find((r) => r.name.toLowerCase() === selectedScopeId.toLowerCase());
  const canHarmonize = selectedScopeId === 'all' || selectedScopeId === 'custom' || (selectedRegionObj?.harmonization_ready ?? true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              MODIS & VIIRS Sensor Harmonization Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Statistical calibration mapping VIIRS 375m observations into seamless continuity with the 20-year MODIS baseline
          </p>
        </div>

        <div className="flex items-center gap-2">
          {uncertainty && (
            <div className="hidden md:flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Uncertainty: {uncertainty.uncertainty_range_mw} ({uncertainty.confidence_level})</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchData}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <Spinner size="lg" label="Loading Harmonization Architecture..." />
      ) : (
        <>
          {/* Dynamic Dataset Scope & AOI Specification Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wide">
                    Uploaded Datasets Scope & Auto-Discovered Regions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Automatically discovers regions from your uploaded NASA FIRMS files and tests cross-sensor pairing
                  </p>
                </div>
              </div>

              {/* Matched Pairs Live Metric Pill */}
              <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Matched Pairs in Selection:
                </span>
                <span className="text-emerald-400 font-bold text-sm">
                  {formatNumber(coincidentSummary.total_pairs)}
                </span>
              </div>
            </div>

            {/* Dynamic Datasets Grid: Fully Populated from Uploaded Data! */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Option 1: All Uploaded Data */}
              <button
                onClick={() => handleSelectScope('all')}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                  selectedScopeId === 'all'
                    ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${selectedScopeId === 'all' ? 'text-amber-300' : 'text-slate-200'}`}>
                      All Uploaded Datasets (Global)
                    </span>
                    {selectedScopeId === 'all' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Full analytical repository across all uploaded files
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-semibold font-mono">
                    ✓ Full Cross-Sensor Calibration
                  </span>
                </div>
              </button>

              {/* Options from DuckDB: Discovered Regions */}
              {discoveredRegions.map((region) => {
                const isActive = selectedScopeId.toLowerCase() === region.name.toLowerCase();
                return (
                  <button
                    key={region.name}
                    onClick={() => handleSelectScope(region.name)}
                    className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
                          {region.name}
                        </span>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10.5px] text-slate-400">
                        <span className="text-cyan-300 font-mono">MODIS: {formatNumber(region.modis_count)}</span>
                        <span>•</span>
                        <span className="text-emerald-300 font-mono">VIIRS: {formatNumber(region.viirs_count)}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10.5px]">
                      {region.harmonization_ready ? (
                        <span className="text-emerald-400 font-semibold font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Ready: {formatNumber(region.coincident_pairs)} Pairs
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium font-mono flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          Single Sensor (Upload pair)
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Option: Custom Coordinates */}
              <button
                onClick={() => handleSelectScope('custom')}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                  selectedScopeId === 'custom'
                    ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${selectedScopeId === 'custom' ? 'text-amber-300' : 'text-slate-200'}`}>
                      Custom Bounding Box & Dates
                    </span>
                    {selectedScopeId === 'custom' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Enter custom latitude/longitude coordinates and date range
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">Custom Geometry</span>
                </div>
              </button>
            </div>

            {/* Custom Coordinates & Dates Input if Custom selected */}
            {selectedScopeId === 'custom' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Min Lat</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="-90.0"
                    value={customFilters.min_lat ?? ''}
                    onChange={(e) => setCustomFilters((prev) => ({ ...prev, min_lat: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Max Lat</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="90.0"
                    value={customFilters.max_lat ?? ''}
                    onChange={(e) => setCustomFilters((prev) => ({ ...prev, max_lat: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Min Lon</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="-180.0"
                    value={customFilters.min_lon ?? ''}
                    onChange={(e) => setCustomFilters((prev) => ({ ...prev, min_lon: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Max Lon</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="180.0"
                    value={customFilters.max_lon ?? ''}
                    onChange={(e) => setCustomFilters((prev) => ({ ...prev, max_lon: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customFilters.start_date || ''}
                    onChange={(e) => setCustomFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fetchCoincidentSummary(customFilters)}
                    className="w-full"
                  >
                    Apply Bounds
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Warning Banner if selected region cannot be harmonized */}
          {!canHarmonize && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs text-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300 font-semibold mb-0.5">
                  Single Sensor Uploaded for this Region
                </strong>
                <p className="text-slate-300 leading-relaxed">
                  Cross-sensor harmonization requires coincident fire observations from both MODIS (1km) and VIIRS (375m) in the same geographic region and timeframe. Please upload the corresponding companion sensor CSV in <strong>Data Pipeline & Sync</strong> to enable calibration for this region.
                </p>
              </div>
            </div>
          )}

          {/* Method Selection Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-500" />
              Available Cross-Sensor Calibration Frameworks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {methods.map((method) => (
                <CalibrationCard
                  key={method.id}
                  method={method}
                  isSelected={selectedMethodId === method.id}
                  onSelect={() => setSelectedMethodId(method.id)}
                  onRun={handleRunCalibration}
                  isRunning={runningMethod && selectedMethodId === method.id}
                  activeResult={selectedMethodId === method.id ? activeResult : null}
                />
              ))}
            </div>
          </div>

          {/* Metrics Goodness-of-Fit */}
          <MetricsComparison
            metrics={activeResult?.metrics}
            methodName={selectedMethodObj?.name}
          />

          {/* Scatter Plot & Harmonized Index Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CalibrationScatterPlot
              calibrationResult={activeResult}
              method={selectedMethodId}
            />

            <ActivityIndexChart activityData={activityIndex} />
          </div>

          {/* Calibration Run History from DuckDB */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Harmonization Run Logs & Benchmarks ({runHistory.length} Recorded)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Storage: analytics.duckdb</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Run ID</th>
                    <th className="p-2.5">Algorithm</th>
                    <th className="p-2.5">Pairs Sampled</th>
                    <th className="p-2.5">MAE (MW)</th>
                    <th className="p-2.5">RMSE (MW)</th>
                    <th className="p-2.5">Correlation (r)</th>
                    <th className="p-2.5">Executed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {runHistory.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-800/20">
                      <td className="p-2.5 font-mono text-amber-400 font-bold">{run.id}</td>
                      <td className="p-2.5 capitalize">
                        <Badge variant="harmonized">{run.method.replace('_', ' ')}</Badge>
                      </td>
                      <td className="p-2.5 font-mono">{run.samples_count || '1,000'}</td>
                      <td className="p-2.5 font-mono text-slate-300">
                        {run.metrics_mae?.toFixed(2) || '—'}
                      </td>
                      <td className="p-2.5 font-mono text-slate-300">
                        {run.metrics_rmse?.toFixed(2) || '—'}
                      </td>
                      <td className="p-2.5 font-mono text-emerald-400 font-bold">
                        {run.metrics_correlation?.toFixed(3) || '—'}
                      </td>
                      <td className="p-2.5 text-slate-400 font-mono">
                        {formatDate(run.created_at)}
                      </td>
                    </tr>
                  ))}
                  {runHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-500">
                        No previous runs recorded. Click "Fit & Calibrate Database" on any method above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

