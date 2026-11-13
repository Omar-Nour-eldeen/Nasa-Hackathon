import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, FeatureTab } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { CalendarView } from './features/calendar/CalendarView';
import { MapView } from './features/map/MapView';
import { HarmonizationView } from './features/harmonization/HarmonizationView';
import { AnomaliesView } from './features/anomalies/AnomaliesView';
import { AnalyticsView } from './features/analytics/AnalyticsView';
import { IngestionView } from './features/ingestion/IngestionView';
import { ExportsView } from './features/exports/ExportsView';
import { anomalyService } from './services/anomalyService';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [anomaliesCount, setAnomaliesCount] = useState<number>(0);

  const fetchAnomalyCount = async () => {
    try {
      const stats = await anomalyService.getStatistics();
      if (stats && stats.total_anomalies) {
        setAnomaliesCount(stats.total_anomalies);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchAnomalyCount();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Mission Control Navbar */}
      <Navbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onRefreshData={fetchAnomalyCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          anomaliesCount={anomaliesCount}
        />

        {/* Feature View Router */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardOverview onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'calendar' && <CalendarView />}

          {activeTab === 'map' && <MapView />}

          {activeTab === 'harmonization' && <HarmonizationView />}

          {activeTab === 'anomalies' && (
            <AnomaliesView onUpdateAnomalyCount={setAnomaliesCount} />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'ingestion' && <IngestionView />}

          {activeTab === 'exports' && <ExportsView />}
        </main>
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default App;
