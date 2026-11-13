import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  GitCompare,
  AlertTriangle,
  BarChart3,
  Database,
  Download,
  Flame,
  ChevronRight,
} from 'lucide-react';

export type FeatureTab =
  | 'dashboard'
  | 'calendar'
  | 'map'
  | 'harmonization'
  | 'anomalies'
  | 'analytics'
  | 'ingestion'
  | 'exports';

interface SidebarProps {
  activeTab: FeatureTab;
  onSelectTab: (tab: FeatureTab) => void;
  isOpen: boolean;
  onClose?: () => void;
  anomaliesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  anomaliesCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as FeatureTab,
      label: 'Mission Dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'calendar' as FeatureTab,
      label: 'Activity Calendar',
      icon: Calendar,
      badge: 'Core',
    },
    {
      id: 'map' as FeatureTab,
      label: 'Geospatial Hotspots',
      icon: MapPin,
    },
    {
      id: 'harmonization' as FeatureTab,
      label: 'Sensor Harmonization',
      icon: GitCompare,
      badge: 'MODIS/VIIRS',
    },
    {
      id: 'anomalies' as FeatureTab,
      label: 'Anomaly Detection',
      icon: AlertTriangle,
      badge: anomaliesCount > 0 ? String(anomaliesCount) : undefined,
      badgeColor: 'red',
    },
    {
      id: 'analytics' as FeatureTab,
      label: 'Fire Regimes & Trends',
      icon: BarChart3,
    },
    {
      id: 'ingestion' as FeatureTab,
      label: 'Data Pipeline & Sync',
      icon: Database,
    },
    {
      id: 'exports' as FeatureTab,
      label: 'Exports & Reports',
      icon: Download,
    },
  ];

  const handleSelect = (tab: FeatureTab) => {
    onSelectTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 shrink-0 border-r border-slate-800 bg-slate-950/95 p-4 transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="space-y-6">
          {/* Mission Scope Pill */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>NASA Space Apps</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Harmonizing two decades of MODIS with high-resolution VIIRS for fire regime analytics.
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs shadow-amber-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          item.badgeColor === 'red'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                            : isActive
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400/80" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sensor Specs Footer Card */}
        <div className="border-t border-slate-800/80 pt-4 space-y-2 text-[11px] text-slate-400">
          <div className="flex justify-between items-center text-slate-300">
            <span>Sensors In Use:</span>
            <span className="font-mono text-emerald-400">Dual Spectrum</span>
          </div>
          <div className="space-y-1 bg-slate-900/40 p-2 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-blue-400">MODIS:</span>
              <span className="font-mono text-slate-300">Terra & Aqua (2000+)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-400">VIIRS:</span>
              <span className="font-mono text-slate-300">S-NPP & JPSS-1 (375m)</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

