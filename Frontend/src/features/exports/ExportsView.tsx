import React, { useState, useEffect } from 'react';
import { exportService, ExportResult } from '../../services/exportService';
import { ExportHistoryRecord } from '../../types/analytics';
import { formatNumber, formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Download,
  FileSpreadsheet,
  History,
  CheckCircle,
  FileText,
  Shield,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const ExportsView: React.FC = () => {
  const [history, setHistory] = useState<ExportHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<ExportResult | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await exportService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load export history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGenerate = async (type: 'harmonized' | 'observations' | 'validation' | 'anomalies') => {
    setGenerating(type);
    try {
      let res: ExportResult;
      if (type === 'harmonized') {
        res = await exportService.exportHarmonized();
      } else if (type === 'observations') {
        res = await exportService.exportObservations();
      } else if (type === 'validation') {
        res = await exportService.exportValidation();
      } else {
        res = await exportService.exportCsv('anomalies', 5000);
      }
      setLastExport(res);
      await fetchHistory();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadFile = (exportId: string) => {
    const url = exportService.getDownloadUrl(exportId);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Analytical Exports & CSV Generation Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Produce machine-readable CSV archives and validation benchmark dossiers for GIS tools & emergency responders
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchHistory}
          loading={loading}
        >
          Refresh History
        </Button>
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg w-fit">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Harmonized Hotspots CSV</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calibrated VIIRS & MODIS active fire dataset where sensor origin is harmonized to the MODIS baseline.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={() => handleGenerate('harmonized')}
            loading={generating === 'harmonized'}
          >
            Generate Harmonized CSV
          </Button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg w-fit">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">All Observations CSV</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete raw satellite fire repository including brightness temperature, scan/track, and confidence.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => handleGenerate('observations')}
            loading={generating === 'observations'}
          >
            Export All Observations
          </Button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-red-500/40 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg w-fit">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Extreme Anomalies CSV</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Statistical fire intensity outliers exceeding baseline standard deviations (Z-score &gt; threshold).
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => handleGenerate('anomalies')}
            loading={generating === 'anomalies'}
          >
            Export Anomalies CSV
          </Button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg w-fit">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Validation Benchmark CSV</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Statistical accuracy log containing MAE, RMSE, Pearson r, and bias across all calibration iterations.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => handleGenerate('validation')}
            loading={generating === 'validation'}
          >
            Export Benchmark CSV
          </Button>
        </div>
      </div>

      {/* Last Generated Callout */}
      {lastExport && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-white">
                Export Generated: {lastExport.file_name}
              </p>
              <p className="text-[11px] text-emerald-300">
                Contains {formatNumber(lastExport.record_count)} rows ready for GIS / QGIS / ArcGIS ingestion.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={() => handleDownloadFile(lastExport.export_id)}
          >
            Download CSV Now
          </Button>
        </div>
      )}

      {/* Export History Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Downloadable File Repository ({history.length} Files Available)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Location: Backend/data/exports/</span>
        </div>

        {loading ? (
          <Spinner size="md" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">File Name</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Records Count</th>
                  <th className="p-2.5">Generated At</th>
                  <th className="p-2.5 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20">
                    <td className="p-2.5 font-mono text-white font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      {item.file_name}
                    </td>
                    <td className="p-2.5">
                      <Badge variant="harmonized">{item.file_type || 'CSV Export'}</Badge>
                    </td>
                    <td className="p-2.5 font-mono">{formatNumber(item.record_count)}</td>
                    <td className="p-2.5 text-slate-400 font-mono">{formatDate(item.created_at)}</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleDownloadFile(item.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No exports generated yet. Choose one of the export actions above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

