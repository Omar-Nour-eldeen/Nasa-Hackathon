import React, { useState, useEffect } from 'react';
import { Flame, Satellite, Activity, Menu, X, RefreshCw } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onRefreshData,
}) => {
  const [time, setTime] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'online' | 'connecting' | 'offline'>('connecting');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().slice(0, 19).replace('T', ' ') + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const res = await dashboardService.getHealth();
        if (mounted && res && res.status === 'healthy') {
          setBackendStatus('online');
        } else if (mounted) {
          setBackendStatus('offline');
        }
      } catch {
        if (mounted) setBackendStatus('offline');
      }
    };
    checkHealth();
    const poll = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Mission Tag */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-red-600 shadow-lg shadow-amber-500/20">
              <Flame className="h-6 w-6 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">PyroScope</span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-slate-700">
                  <Satellite className="w-3 h-3" /> NASA FIRMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Harmonized Active Fire Hotspot & Activity Calendar (MODIS + VIIRS)
              </p>
            </div>
          </div>
        </div>

        {/* Right Status Indicators & Live Clock */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-slate-500">SYS_TIME:</span>
            <span>{time}</span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1 border border-slate-800 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : backendStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-400'
              }`}
            />
            <span className="text-slate-300 font-medium capitalize">
              {backendStatus === 'online' ? 'Engine Ready' : backendStatus}
            </span>
          </div>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              title="Refresh Global Data"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> MODIS 1km
            </span>
            <span className="text-slate-600">/</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> VIIRS 375m
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

