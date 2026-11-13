import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { observationService } from '../../services/observationService';
import { harmonizationService, DiscoveredRegion } from '../../services/harmonizationService';
import { FeatureTab } from '../../components/layout/Sidebar';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { CalendarDayData, MapHotspot } from '../../types/fire';
import { formatNumber, formatFrp, formatDate } from '../../utils/formatters';
import {
  Flame,
  Satellite,
  Calendar,
  AlertTriangle,
  MapPin,
  GitCompare,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Download,
  RefreshCw,
  Zap,
  Globe,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardOverviewProps {
  onNavigateTab: (tab: FeatureTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigateTab }) => {
  const [overview, setOverview] = useState<{
    observations: {
      total_observations: number;
      modis_count: number;
      viirs_count: number;
      avg_frp: number;
      max_frp: number;
      min_frp: number;
    };
    anomalies: {
      total_anomalies: number;
      avg_frp: number;
      max_frp: number;
      high_severity_count: number;
      extreme_severity_count: number;
    };
  } | null>(null);

  const [discoveredRegions, setDiscoveredRegions] = useState<DiscoveredRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [calendarSample, setCalendarSample] = useState<CalendarDayData[]>([]);
  const [trends, setTrends] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async (targetRegion?: string) => {
    setLoading(true);
    try {
      const reg = targetRegion !== undefined ? targetRegion : selectedRegion;
      const [overviewData, calData, trendsData] = await Promise.all([
        dashboardService.getOverview(reg),
        dashboardService.getCalendar(reg),
        dashboardService.getTrends(),
      ]);
      setOverview(overviewData);
      setCalendarSample(calData.slice(-14)); // Last 14 days
      setTrends(trendsData.counts?.slice(-20) || []);
    } catch (err) {
      console.error('Failed to load dashboard overview', err);
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

  const totalObs = overview?.observations?.total_observations || 0;
  const modisCount = overview?.observations?.modis_count || 0;
  const viirsCount = overview?.observations?.viirs_count || 0;
  const avgFrp = overview?.observations?.avg_frp || 0;
  const maxFrp = overview?.observations?.max_frp || 0;
  const extremeAnomalies = overview?.anomalies?.extreme_severity_count || 0;

  return (
    <div className="space-y-6">
      {/* Hero Mission Control Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Active Fire Monitoring & Sensor Harmonization
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Harmonized Burning Activity Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Synthesizing 20+ years of MODIS historical records with high-resolution VIIRS (375m) continuity. Enabling emergency managers and land stewards to compare current burning regimes against multi-year baselines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="md"
              icon={Calendar}
              onClick={() => onNavigateTab('calendar')}
            >
              Open Burning Calendar
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={MapPin}
              onClick={() => onNavigateTab('map')}
            >
              Geospatial Hotspots
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => fetchData()}
              loading={loading}
            >
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* Active Dataset Scope Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            Dashboard Regional Scope:
          </span>
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="ALL">🌍 All Uploaded Datasets (Global Operations)</option>
            {discoveredRegions.map((reg) => (
              <option key={reg.name} value={reg.name}>
                📍 {reg.name} ({formatNumber(reg.total_obs)} records)
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-400">
          Telemetry Scoped to: <span className="text-amber-400 font-bold">{selectedRegion === 'ALL' ? 'Global Aggregate' : selectedRegion}</span>
        </div>
      </div>

      {loading ? (
        <Spinner size="lg" label="Synchronizing Mission Overview..." />
      ) : (
        <>
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Active Hotspots"
              value={formatNumber(totalObs)}
              subtitle={`${formatNumber(modisCount)} MODIS + ${formatNumber(viirsCount)} VIIRS`}
              icon={Flame}
              color="amber"
              trend={{ value: '+14.2%', isPositive: false }}
            />

            <StatCard
              title="Extreme Thermal Anomalies"
              value={formatNumber(extremeAnomalies)}
              subtitle="Exceeding 2.5 σ historical baseline"
              icon={AlertTriangle}
              color="red"
            />

            <StatCard
              title="Mean Combustion FRP"
              value={formatFrp(avgFrp)}
              subtitle={`Peak: ${formatFrp(maxFrp)}`}
              icon={Zap}
              color="blue"
            />

            <StatCard
              title="Sensor Harmonization"
              value="OLS Active"
              subtitle="VIIRS 375m calibrated to MODIS"
              icon={GitCompare}
              color="emerald"
            />
          </div>

          {/* Core Feature Teasers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Burning Calendar Teaser */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Burning Activity Calendar Preview
                    </h3>
                  </div>
                  <Badge variant="harmonized">Multi-Year Matrix</Badge>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Rapidly visualize which months and years had peak fire activity, and compare current burning against the historical median.
                </p>

                {/* Mini Daily Trend Bar Chart */}
                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calendarSample}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        tickFormatter={(d) => formatDate(d).split(',')[0]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2 text-xs">
                                <p className="font-semibold text-white">{formatDate(String(label))}</p>
                                <p className="text-amber-400 font-bold font-mono">
                                  {payload[0].value} Hotspots
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="fire_count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => onNavigateTab('calendar')}
                >
                  Explore Full Burning Calendar & Anomaly Matrix
                </Button>
              </div>
            </div>

            {/* 2. Geospatial Explorer Teaser */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Geospatial Hotspot & AOI Filter
                    </h3>
                  </div>
                  <Badge variant="viirs">VIIRS 375m + MODIS</Badge>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive geospatial canvas mapping thermal radiation emissions. Filter by bounding box coordinates, min FRP threshold, and download CSV.
                </p>

                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 border-b border-slate-900 pb-2">
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Radiant Thermal Regimes:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      <span>MODIS 1km</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      <span>VIIRS 375m</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                      <span>Elevated (&gt;45 MW)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#ef4444]" />
                      <span>Extreme (&gt;80 MW)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => onNavigateTab('map')}
                >
                  Launch Interactive Hotspot Map
                </Button>
              </div>
            </div>
          </div>

          {/* Secondary Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateTab('harmonization')}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <GitCompare className="w-5 h-5 text-purple-400" />
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="text-sm font-bold text-white">Cross-Sensor Harmonization</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Linear Regression, Quantile Mapping, Ratio, and Random Forest models bridging MODIS and VIIRS.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('anomalies')}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-red-500/40 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="text-sm font-bold text-white">Statistical Anomaly Engine</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tune Z-Score threshold sliders to trigger real-time detection of high-risk outlier fire fronts.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('exports')}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <Download className="w-5 h-5 text-cyan-400" />
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="text-sm font-bold text-white">Export & Download CSV</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download harmonized fire hotspot CSVs and validation reports for QGIS, ArcGIS, or emergency operations.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
