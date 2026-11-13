import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { harmonizationService, DiscoveredRegion } from '../../services/harmonizationService';
import {
  HotspotTrendPoint,
  FrpTrendPoint,
  LandCoverStat,
  RegionStat,
  SensorComparisonItem,
} from '../../types/analytics';
import { formatNumber, formatFrp, formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  BarChart3,
  TrendingUp,
  TreePine,
  Globe2,
  RefreshCw,
  Zap,
  Layers,
  Globe,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [discoveredRegions, setDiscoveredRegions] = useState<DiscoveredRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [hotspotTrends, setHotspotTrends] = useState<HotspotTrendPoint[]>([]);
  const [frpTrends, setFrpTrends] = useState<FrpTrendPoint[]>([]);
  const [landCover, setLandCover] = useState<LandCoverStat[]>([]);
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [sensorComp, setSensorComp] = useState<SensorComparisonItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async (targetRegion?: string) => {
    setLoading(true);
    try {
      const reg = targetRegion !== undefined ? targetRegion : selectedRegion;
      const [hTrends, fTrends, lcData, regData, sComp] = await Promise.all([
        analyticsService.getHotspotTrends(period, reg),
        analyticsService.getFrpTrends(reg),
        analyticsService.getLandCover(),
        analyticsService.getRegions(),
        analyticsService.getSensorComparison(reg),
      ]);

      setHotspotTrends(hTrends);
      setFrpTrends(fTrends);
      setLandCover(lcData);
      setRegions(regData);
      setSensorComp(sComp);
    } catch (err) {
      console.error('Failed to load analytics', err);
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
  }, [period]);

  const handleRegionChange = (newReg: string) => {
    setSelectedRegion(newReg);
    fetchData(newReg);
  };

  const PIE_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Fire Regimes & Multi-Decadal Sensor Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing combustion energy trends, vegetative fuel types, and regional burning patterns
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs">
            {(['daily', 'monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded font-semibold capitalize transition-all cursor-pointer ${
                  period === p
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchData()}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Scope & Dataset Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            Analytics Regional Scope:
          </span>
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="ALL">🌍 All Uploaded Datasets (Global Aggregate)</option>
            {discoveredRegions.map((reg) => (
              <option key={reg.name} value={reg.name}>
                📍 {reg.name} ({formatNumber(reg.total_obs)} records)
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-400">
          Scope: <span className="text-amber-400 font-bold">{selectedRegion === 'ALL' ? 'Global Multi-Dataset' : selectedRegion}</span>
        </div>
      </div>

      {loading ? (
        <Spinner size="lg" label="Processing Multi-Decadal Analytical Views..." />
      ) : (
        <>
          {/* 1. Hotspot Frequency Trends Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Active Hotspot Frequency Evolution ({period.toUpperCase()})
                </h3>
                <p className="text-xs text-slate-400">
                  Total detected thermal anomalies showing seasonal peaks and multi-year shifts
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {hotspotTrends.length} Intervals Recorded
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hotspotTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hotspotGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tickFormatter={(d) => formatDate(String(d)).split(',')[0]}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl text-xs space-y-1">
                            <p className="font-semibold text-white">{formatDate(String(label))}</p>
                            <div className="text-amber-400 font-mono font-bold">
                              Hotspots: {formatNumber(payload[0].value as number)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
                    formatter={(val) => <span className="text-slate-300">{val}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Hotspot Count"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#hotspotGrad)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Fire Radiative Power (FRP) Energy Evolution */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Radiative Energy & Combustion Intensity (FRP in Megawatts)
                </h3>
                <p className="text-xs text-slate-400">
                  Measuring physical energy emission: Average FRP reflects fuel density; Peak FRP indicates extreme crown fire runs
                </p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={frpTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tickFormatter={(d) => formatDate(String(d)).split(',')[0]}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as FrpTrendPoint;
                        return (
                          <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl text-xs space-y-1">
                            <p className="font-semibold text-white">{formatDate(String(label))}</p>
                            <div className="text-cyan-400 font-mono">
                              Avg FRP: {formatFrp(data.avg_frp)}
                            </div>
                            <div className="text-red-400 font-mono font-bold">
                              Peak FRP: {formatFrp(data.max_frp)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
                    formatter={(val) => <span className="text-slate-300">{val}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_frp"
                    name="Average FRP (MW)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="max_frp"
                    name="Peak Incident FRP (MW)"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Land Cover & Regional Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Land Cover Classification */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <TreePine className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Land-Cover Fuel Type Breakdown
                </h3>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={landCover}
                      dataKey="hotspot_count"
                      nameKey="land_cover"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {landCover.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as LandCoverStat;
                          return (
                            <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2 text-xs space-y-1">
                              <p className="font-bold text-white">{data.land_cover}</p>
                              <div className="text-slate-300">
                                Hotspots: {formatNumber(data.hotspot_count)}
                              </div>
                              <div className="text-amber-400 font-mono">
                                Mean FRP: {formatFrp(data.avg_frp)}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(val) => <span className="text-slate-300">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cross-Sensor Divergence Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  MODIS vs VIIRS Observational Contrast
                </h3>
              </div>

              <div className="space-y-3 pt-1">
                {sensorComp.map((item) => (
                  <div
                    key={item.sensor}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Badge variant={item.sensor === 'VIIRS' ? 'viirs' : 'modis'}>
                          {item.sensor}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {item.sensor === 'VIIRS' ? '375m I-Band Nadir' : '1km Conventional'}
                        </span>
                      </span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {formatNumber(item.count)} Detections
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                      <div>
                        <span>Mean FRP: </span>
                        <strong className="text-white font-mono">{formatFrp(item.avg_frp)}</strong>
                      </div>
                      <div>
                        <span>Max FRP: </span>
                        <strong className="text-white font-mono">{formatFrp(item.max_frp)}</strong>
                      </div>
                    </div>
                  </div>
                ))}

                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  VIIRS detects ~3× to 4× more hotspots due to 375m sub-pixel sensitivity to small flaming targets, emphasizing the critical need for PyroScope's harmonization transfer function.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
