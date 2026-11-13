import React, { useState, useEffect, useRef } from 'react';
import { ingestionService, DataSourceItem } from '../../services/ingestionService';
import { harmonizationService, DiscoveredRegion } from '../../services/harmonizationService';
import { jobService } from '../../services/jobService';
import { BackgroundJob } from '../../types/analytics';
import { formatNumber, formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Database,
  UploadCloud,
  FileText,
  Play,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Sparkles,
  GitMerge,
  Grid,
  Satellite,
  Trash2,
  AlertTriangle,
  Globe,
} from 'lucide-react';

export const IngestionView: React.FC = () => {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [regions, setRegions] = useState<DiscoveredRegion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [deletingRegion, setDeletingRegion] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [pipelineActionLoading, setPipelineActionLoading] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sourcesData, jobsData, regionsData] = await Promise.all([
        ingestionService.getSources(),
        jobService.getJobs(),
        harmonizationService.getDiscoveredRegions(),
      ]);
      setSources(sourcesData);
      setJobs(jobsData);
      setRegions(regionsData || []);
    } catch (err) {
      console.error('Failed to load ingestion data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegion = async (regionName: string) => {
    if (!window.confirm(`Are you sure you want to delete all stored observations for "${regionName}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingRegion(regionName);
    try {
      await ingestionService.deleteRegion(regionName);
      setUploadMessage(`🗑️ Successfully deleted all stored observation records for "${regionName}".`);
      await fetchData();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      setUploadMessage(`❌ Failed to delete dataset: ${errObj?.response?.data?.message || 'Delete error'}`);
    } finally {
      setDeletingRegion(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("⚠️ DANGER: Are you sure you want to purge the entire database? All observations and anomalies across all regions will be erased!")) {
      return;
    }
    setDeletingRegion('ALL');
    try {
      await ingestionService.clearAllData();
      setUploadMessage("🗑️ Database successfully cleared. All observation records purged.");
      await fetchData();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      setUploadMessage(`❌ Clear error: ${errObj?.response?.data?.message || 'Purge error'}`);
    } finally {
      setDeletingRegion(null);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const jobsData = await jobService.getJobs();
        setJobs(jobsData);
      } catch {
        // silent catch
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);
    try {
      const res = await ingestionService.uploadFile(file, undefined, true);
      setUploadMessage(
        `✅ Successfully uploaded "${res.filename}"! Ingested ${res.imported_records || 0} observations into DuckDB analytics database.`
      );
      await fetchData();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      setUploadMessage(`❌ Upload error: ${errObj?.response?.data?.message || 'File upload failed'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRunClean = async () => {
    setPipelineActionLoading('clean');
    try {
      await ingestionService.cleanData();
      await fetchData();
    } catch (err) {
      console.error('Data clean failed', err);
    } finally {
      setPipelineActionLoading(null);
    }
  };

  const handleRunSpatialMatch = async () => {
    setPipelineActionLoading('match');
    try {
      await ingestionService.runSpatialMatching(1.5);
      await fetchData();
    } catch (err) {
      console.error('Spatial match failed', err);
    } finally {
      setPipelineActionLoading(null);
    }
  };

  const handleGenerateGrid = async () => {
    setPipelineActionLoading('grid');
    try {
      await ingestionService.generateSpatialGrid(0.1);
      await fetchData();
    } catch (err) {
      console.error('Grid generation failed', err);
    } finally {
      setPipelineActionLoading(null);
    }
  };

  const handleCreateJob = async () => {
    setPipelineActionLoading('job');
    try {
      await ingestionService.createProcessingJob('batch_calibration_pipeline');
      const updatedJobs = await jobService.getJobs();
      setJobs(updatedJobs);
    } catch (err) {
      console.error('Job submission failed', err);
    } finally {
      setPipelineActionLoading(null);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await jobService.cancelJob(jobId);
      const updatedJobs = await jobService.getJobs();
      setJobs(updatedJobs);
    } catch (err) {
      console.error('Cancel job failed', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Data Ingestion & Processing Pipeline
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Import NASA FIRMS satellite active fire CSV feeds and execute embedded DuckDB processing workflows
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchData}
          loading={loading}
        >
          Refresh Pipeline
        </Button>
      </div>

      {/* CSV File Drag & Drop Upload Zone */}
      <div className="rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/40 p-8 transition-colors text-center space-y-3">
        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            Upload NASA FIRMS Active Fire CSV Dataset
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Accepts MODIS (MOD14/MYD14) or VIIRS (VNP14IMGTDL / VJ114IMGTDL) country archives. Automatically detects sensor format.
          </p>
        </div>

        <div className="pt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
            id="firms-file-upload"
          />
          <label htmlFor="firms-file-upload">
            <Button
              variant="primary"
              size="sm"
              icon={UploadCloud}
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse & Ingest CSV
            </Button>
          </label>
        </div>

        {uploadMessage && (
          <div className="mt-3 text-xs p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
            {uploadMessage}
          </div>
        )}
      </div>

      {/* Uploaded Regional Datasets in DuckDB with Deletion Option */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Uploaded Regional Datasets ({regions.length} Partitions in DuckDB)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage persisted FIRMS datasets. You can inspect statistics or delete specific regional partitions.
            </p>
          </div>

          {regions.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={deletingRegion !== null}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-500/30 transition-all font-semibold cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              Purge All Datasets
            </button>
          )}
        </div>

        {regions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No active datasets found in database. Upload a NASA FIRMS CSV archive above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {regions.map((reg) => (
              <div
                key={reg.name}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      📍 {reg.name}
                    </span>
                    <Badge variant={reg.has_both_sensors ? 'success' : 'medium'}>
                      {reg.has_both_sensors ? 'Dual Sensors' : 'Single Sensor'}
                    </Badge>
                  </div>

                  <div className="mt-2 text-xs space-y-1.5 text-slate-400">
                    <div className="flex justify-between">
                      <span>Total Hotspots:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatNumber(reg.total_obs)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>MODIS / VIIRS Split:</span>
                      <span className="font-mono text-slate-300">
                        <span className="text-cyan-400">{formatNumber(reg.modis_count)} M</span> /{' '}
                        <span className="text-emerald-400">{formatNumber(reg.viirs_count)} V</span>
                      </span>
                    </div>
                    {reg.start_date && (
                      <div className="flex justify-between text-[11px]">
                        <span>Time Interval:</span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          {formatDate(reg.start_date)} - {formatDate(reg.end_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {reg.coincident_pairs} Coincident Pairs
                  </span>
                  <button
                    onClick={() => handleDeleteRegion(reg.name)}
                    disabled={deletingRegion !== null}
                    className="text-xs px-2.5 py-1 rounded bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                    {deletingRegion === reg.name ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Satellite Data Sources */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          Configured NASA Earth Observation Streams
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sources.map((src) => (
            <div
              key={src.id}
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <Badge variant={src.sensor === 'VIIRS' ? 'viirs' : 'modis'}>
                  {src.sensor}
                </Badge>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Active Stream
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{src.name}</h4>
              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
                <div className="flex justify-between">
                  <span>Spatial Resolution:</span>
                  <span className="font-mono text-slate-300">{src.spatial_resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span>Temporal Interval:</span>
                  <span className="font-mono text-slate-300">{src.temporal_resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mission History:</span>
                  <span className="font-mono text-slate-300">{src.observation_period}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Processing Pipeline Toolbox */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Embedded DuckDB Analytical Operations
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            High-speed in-process SQL execution running spatial joins and cleaning routines directly over disk
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Data Hygiene & Cleaning
              </h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Filters null FRP, bounds latitude/longitude, and casts ISO dates.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunClean}
              loading={pipelineActionLoading === 'clean'}
            >
              Run Clean
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <GitMerge className="w-4 h-4 text-cyan-400" />
                Spatial-Temporal Matching
              </h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Pairs coincident MODIS and VIIRS hotspots within 1.5 km tolerance.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunSpatialMatch}
              loading={pipelineActionLoading === 'match'}
            >
              Match Pairs
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-purple-400" />
                Spatial Grid Binning
              </h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Aggregates active fire radiative density into 0.1° spatial grid cells.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateGrid}
              loading={pipelineActionLoading === 'grid'}
            >
              Generate Grid
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Play className="w-4 h-4 text-amber-400" />
                Async Task Worker
              </h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Dispatches a multi-step background pipeline job to the worker manager.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateJob}
              loading={pipelineActionLoading === 'job'}
            >
              Queue Task
            </Button>
          </div>
        </div>
      </div>

      {/* Background Jobs Monitor */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Asynchronous Background Pipeline Queue ({jobs.length} Jobs)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Live In-Memory Manager</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-2.5">Job ID</th>
                <th className="p-2.5">Pipeline Task</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Progress</th>
                <th className="p-2.5">Logs / Telemetry</th>
                <th className="p-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/20">
                  <td className="p-2.5 font-mono text-amber-400 font-bold">{job.id}</td>
                  <td className="p-2.5 capitalize">{job.job_type.replace('_', ' ')}</td>
                  <td className="p-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        job.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : job.status === 'running'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="p-2.5 w-36">
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${job.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      {job.progress}%
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                    {job.logs?.length ? job.logs[job.logs.length - 1] : 'Task queued.'}
                  </td>
                  <td className="p-2.5">
                    {job.status === 'running' && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No active or queued background tasks. Click "Queue Task" to initiate an async pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

