import React, { useState, useEffect } from 'react';
import { BurningCalendarMatrix } from './components/BurningCalendarMatrix';
import { HistoricalMedianChart } from './components/HistoricalMedianChart';
import { ColorRampSelector } from './components/ColorRampSelector';
import { dashboardService } from '../../services/dashboardService';
import { harmonizationService, DiscoveredRegion } from '../../services/harmonizationService';
import { exportService } from '../../services/exportService';
import { CalendarDayData } from '../../types/fire';
import { ColorRampType } from '../../utils/colorRamps';
import { exportArrayToCsvFile } from '../../utils/geoUtils';
import { formatNumber, formatFrp } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Calendar, Download, RefreshCw, Flame, BarChart2, Filter, Globe } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [discoveredRegions, setDiscoveredRegions] = useState<DiscoveredRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRamp, setSelectedRamp] = useState<ColorRampType>('viridis');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [activeCellModal, setActiveCellModal] = useState<{
    isOpen: boolean;
    year: number;
    month: number;
    count: number;
    avgFrp: number;
  }>({ isOpen: false, year: 2025, month: 0, count: 0, avgFrp: 0 });

  const fetchData = async (targetRegion?: string) => {
    setLoading(true);
    try {
      const reg = targetRegion !== undefined ? targetRegion : selectedRegion;
      const data = await dashboardService.getCalendar(reg);
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regs = await harmonizationService.getDiscoveredRegions();
        setDiscoveredRegions(regs || []);
      } catch (e) {
        console.warn('Failed to load discovered regions', e);
      }
    };
    loadRegions();
    fetchData();
  }, []);

  const handleRegionChange = (newReg: string) => {
    setSelectedRegion(newReg);
    fetchData(newReg);
  };

  const handleCellSelect = (year: number, month: number, count: number, avgFrp: number) => {
    setSelectedYear(year);
    setActiveCellModal({
      isOpen: true,
      year,
      month,
      count,
      avgFrp,
    });
  };

  const handleDownloadCalendarCsv = () => {
    if (calendarData.length === 0) return;
    exportArrayToCsvFile('pyroscope_burning_activity_calendar.csv', calendarData as unknown as Record<string, unknown>[]);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const totalHotspots = (calendarData || []).reduce((acc, curr) => acc + (curr?.fire_count || 1), 0);
  const activeDays = (calendarData || []).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Harmonized Burning Activity Calendar
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multi-decadal satellite active fire regime calendar combining MODIS (2000+) & VIIRS (375m)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchData()}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleDownloadCalendarCsv}
          >
            Export Calendar CSV
          </Button>
        </div>
      </div>

      {/* Active Dataset Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            Target Dataset / Calendar Scope:
          </span>
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="ALL">🌍 All Uploaded Datasets (Multi-Regional Aggregate)</option>
            {discoveredRegions.map((reg) => (
              <option key={reg.name} value={reg.name}>
                📍 {reg.name} ({formatNumber(reg.total_obs)} records)
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-400">
          Scope: <span className="text-amber-400 font-bold">{selectedRegion === 'ALL' ? 'Global Aggregate' : selectedRegion}</span>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Total Hotspots Recorded</p>
          <p className="text-xl font-bold text-white mt-1 font-mono">{formatNumber(totalHotspots)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Harmonized observations</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Temporal Coverage</p>
          <p className="text-xl font-bold text-cyan-400 mt-1 font-mono">{activeDays} Days</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Across active monitoring years</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Selected Evaluation Year</p>
          <p className="text-xl font-bold text-amber-400 mt-1 font-mono">{selectedYear}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Baseline comparison target</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Harmonization Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-base font-bold text-white">Active</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">MODIS 1km calibrated to VIIRS</p>
        </div>
      </div>

      {/* Color Ramp Selector */}
      <ColorRampSelector
        currentRamp={selectedRamp}
        onChangeRamp={setSelectedRamp}
      />

      {loading ? (
        <Spinner size="lg" label="Computing Harmonized Fire Activity Calendar..." />
      ) : (
        <>
          {/* Core Burning Activity Calendar Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Multi-Year Burning Activity Heat Matrix
              </h2>
              <span className="text-xs text-slate-400">
                Click any cell to inspect regional monthly telemetry
              </span>
            </div>

            <BurningCalendarMatrix
              calendarData={calendarData}
              selectedRamp={selectedRamp}
              onSelectCell={handleCellSelect}
              selectedYear={selectedYear}
            />
          </div>

          {/* Historical Median Anomaly Chart */}
          <HistoricalMedianChart
            calendarData={calendarData}
            comparisonYear={selectedYear}
          />
        </>
      )}

      {/* Cell Detail Modal */}
      <Modal
        isOpen={activeCellModal.isOpen}
        onClose={() => setActiveCellModal((prev) => ({ ...prev, isOpen: false }))}
        title={`${monthNames[activeCellModal.month]} ${activeCellModal.year} — Detailed Burning Profile`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Hotspots Detected:</span>
              <span className="text-xl font-bold font-mono text-white">
                {formatNumber(activeCellModal.count)}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Mean Radiative Power (FRP):</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {formatFrp(activeCellModal.avgFrp)}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
            <p>
              During <strong>{monthNames[activeCellModal.month]} {activeCellModal.year}</strong>, thermal infrared detectors identified active combustion clusters. Emergency managers use this profile to cross-reference moisture indices and fuel dryness.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveCellModal((prev) => ({ ...prev, isOpen: false }))}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={() => {
                exportService.exportObservations();
              }}
            >
              Export Hotspots for Period
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

