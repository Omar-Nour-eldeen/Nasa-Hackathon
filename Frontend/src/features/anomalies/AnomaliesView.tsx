import React, { useState, useEffect } from 'react';
import { AnomalyDetectorControl } from './components/AnomalyDetectorControl';
import { anomalyService } from '../../services/anomalyService';
import { harmonizationService, DiscoveredRegion } from '../../services/harmonizationService';
import {
  Anomaly,
  AnomalyStatistics,
  AnomalySeverityCount,
  AnomalySeverity,
} from '../../types/anomaly';
import { formatNumber, formatFrp, formatDate } from '../../utils/formatters';
import { exportArrayToCsvFile } from '../../utils/geoUtils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  AlertTriangle,
  Flame,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  MapPin,
  Globe,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface AnomaliesViewProps {
  onUpdateAnomalyCount?: (count: number) => void;
}

export const AnomaliesView: React.FC<AnomaliesViewProps> = ({ onUpdateAnomalyCount }) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [stats, setStats] = useState<AnomalyStatistics | null>(null);
  const [severityCounts, setSeverityCounts] = useState<AnomalySeverityCount[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [discoveredRegions, setDiscoveredRegions] = useState<DiscoveredRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [detecting, setDetecting] = useState<boolean>(false);

  const fetchData = async (targetRegion?: string) => {
    setLoading(true);
    try {
      const reg = targetRegion !== undefined ? targetRegion : selectedRegion;
      const [anomData, statsData, sevData] = await Promise.all([
        anomalyService.getAnomalies(200, severityFilter !== 'ALL' ? severityFilter : undefined, reg),
        anomalyService.getStatistics(reg),
        anomalyService.getBySeverity(reg),
      ]);

      setAnomalies(anomData);
      setStats(statsData);
      setSeverityCounts(sevData);

      if (onUpdateAnomalyCount && statsData?.total_anomalies !== undefined) {
        onUpdateAnomalyCount(statsData.total_anomalies);
      }
    } catch (err) {
      console.error('Error fetching anomalies', err);
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
  }, [severityFilter]);

  const handleRegionChange = (newReg: string) => {
    setSelectedRegion(newReg);
    fetchData(newReg);
  };

  const handleRunDetection = async (threshold: number) => {
    setDetecting(true);
    try {
      await anomalyService.detectAnomalies(threshold, selectedRegion);
      await fetchData();
    } catch (err) {
      console.error('Detection run failed', err);
    } finally {
      setDetecting(false);
    }
  };

  const handleDownloadCsv = () => {
    if (anomalies.length === 0) return;
    exportArrayToCsvFile('pyroscope_anomalies_report.csv', anomalies as unknown as Record<string, unknown>[]);
  };

  const severityColorMap: Record<string, string> = {
    low: '#64748b',
    medium: '#f59e0b',
    high: '#f97316',
    extreme: '#ef4444',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Extreme Thermal Anomalies & Outlier Events
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-sensor statistical outlier detection flagging severe wildfire activity above historical thresholds
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
            onClick={handleDownloadCsv}
          >
            Export Anomalies CSV
          </Button>
        </div>
      </div>

      {/* Scope & Dataset Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            Target Dataset / Region:
          </span>
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="ALL">🌍 All Uploaded Datasets (Global Scan)</option>
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

      {/* Detection Trigger Control */}
      <AnomalyDetectorControl
        onRunDetection={handleRunDetection}
        loading={detecting}
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Total Anomalies</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatNumber(stats?.total_anomalies)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Identified above threshold</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Extreme Severity</p>
          <p className="text-2xl font-bold font-mono text-red-400 mt-1">
            {formatNumber(stats?.extreme_severity_count)}
          </p>
          <p className="text-[10px] text-red-400/80 mt-0.5">Critical emergency response</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Peak Anomaly FRP</p>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {formatFrp(stats?.max_frp)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Maximum radiative intensity</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Average Anomaly FRP</p>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {formatFrp(stats?.avg_frp)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Mean radiative power</p>
        </div>
      </div>

      {loading ? (
        <Spinner size="lg" label="Querying Anomaly Repository..." />
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Severity Distribution Chart */}
            <div className="lg:col-span-1 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Events by Severity Class
              </h3>
              <div className="h-56 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityCounts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="severity"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={(s) => s.toUpperCase()}
                    />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as AnomalySeverityCount;
                          return (
                            <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl text-xs space-y-1">
                              <p className="font-bold text-white uppercase">{data.severity}</p>
                              <div className="text-slate-300">Count: {formatNumber(data.count)}</div>
                              <div className="text-amber-400 font-mono">
                                Mean FRP: {formatFrp(data.mean_frp)}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {severityCounts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={severityColorMap[entry.severity] || '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Severity Filters & List */}
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Active Anomaly Incident Feed ({anomalies.length} items)
                </h3>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Severity:
                  </span>
                  {['ALL', 'low', 'medium', 'high', 'extreme'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeverityFilter(s)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border capitalize transition-all cursor-pointer ${
                        severityFilter === s
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950/80 sticky top-0 text-[11px] text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Severity</th>
                      <th className="p-2.5">Sensor</th>
                      <th className="p-2.5">FRP (MW)</th>
                      <th className="p-2.5">Z-Score</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Coordinates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {anomalies.map((anom) => (
                      <tr key={anom.id} className="hover:bg-slate-800/20">
                        <td className="p-2.5">
                          <Badge variant={anom.severity as AnomalySeverity}>
                            {anom.severity.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-2.5">
                          <Badge variant={anom.sensor?.toUpperCase() === 'VIIRS' ? 'viirs' : 'modis'}>
                            {anom.sensor}
                          </Badge>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-amber-400">
                          {formatFrp(anom.frp)}
                        </td>
                        <td className="p-2.5 font-mono text-cyan-400 font-bold">
                          +{anom.anomaly_score?.toFixed(2)} σ
                        </td>
                        <td className="p-2.5">{formatDate(anom.acq_date)}</td>
                        <td className="p-2.5 font-mono text-slate-400">
                          {anom.latitude?.toFixed(3)}, {anom.longitude?.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                    {anomalies.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No anomalies detected for the chosen threshold or filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

