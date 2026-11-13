import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Observation, MapHotspot } from '../../../types/fire';
import { formatFrp, formatDate } from '../../../utils/formatters';
import { Flame, Info, ChevronDown, ChevronUp, Radio } from 'lucide-react';

// Fix leaflet default icon URLs in bundler environments
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface FireMapProps {
  hotspots: (MapHotspot | Observation)[];
  center?: [number, number];
  zoom?: number;
  onSelectHotspot?: (hotspot: MapHotspot | Observation) => void;
  activeTileLayer?: 'dark' | 'satellite' | 'streets';
  displayMode?: 'raw' | 'harmonized';
}

export const FireMap: React.FC<FireMapProps> = ({
  hotspots,
  center = [36.5, -119.5],
  zoom = 6,
  onSelectHotspot,
  activeTileLayer = 'dark',
  displayMode = 'raw',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const refTileLayerRef = useRef<L.TileLayer | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const [legendExpanded, setLegendExpanded] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Clear any lingering leaflet ID to avoid re-init error
    if ((container as unknown as { _leaflet_id?: number | null })._leaflet_id) {
      (container as unknown as { _leaflet_id?: number | null })._leaflet_id = null;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // High performance canvas renderer for rapid 60 FPS hotspot rendering
    const canvasRenderer = L.canvas({ padding: 0.5 });
    canvasRendererRef.current = canvasRenderer;

    const map = L.map(container, {
      center: center,
      zoom: zoom,
      attributionControl: false,
      zoomControl: true,
      preferCanvas: true,
      renderer: canvasRenderer,
    });

    mapInstanceRef.current = map;

    // Scale control
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Initial Tile Layers: 100% Free, NO API Key, NO Watermarks!
    const baseTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16 }
    );
    baseTile.addTo(map);
    baseTileLayerRef.current = baseTile;

    const refTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16, opacity: 0.8 }
    );
    refTile.addTo(map);
    refTileLayerRef.current = refTile;

    // Markers Layer Group
    const markers = L.layerGroup().addTo(map);
    markersLayerRef.current = markers;

    // Trigger immediate size validation
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (container) {
        (container as unknown as { _leaflet_id?: number | null })._leaflet_id = null;
      }
    };
  }, []);

  // Update Tile Layers when activeTileLayer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (refTileLayerRef.current) {
      map.removeLayer(refTileLayerRef.current);
      refTileLayerRef.current = null;
    }

    if (activeTileLayer === 'satellite') {
      // High-res Esri World Imagery (Satellite) - 100% free, no key
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      );
      sat.addTo(map);
      baseTileLayerRef.current = sat;
    } else if (activeTileLayer === 'streets') {
      // Clean OpenStreetMap standard tiles - 100% free, no key
      const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      });
      osm.addTo(map);
      baseTileLayerRef.current = osm;
    } else {
      // Dark Matter: Esri World Dark Gray Base + Reference Labels (Clean, dark, NO watermarks!)
      const darkBase = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      );
      darkBase.addTo(map);
      baseTileLayerRef.current = darkBase;

      const darkRef = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16, opacity: 0.85 }
      );
      darkRef.addTo(map);
      refTileLayerRef.current = darkRef;
    }
  }, [activeTileLayer]);

  // Smooth FlyTo Center & Zoom when updated
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.2 });
      mapInstanceRef.current.invalidateSize();
    }
  }, [center, zoom]);

  // Render Hotspots as High-Performance CircleMarkers
  useEffect(() => {
    const markers = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    const safeList = Array.isArray(hotspots) ? hotspots : [];

    safeList.forEach((h) => {
      if (!h || !h.latitude || !h.longitude) return;

      const isHarmonizedMode = displayMode === 'harmonized';
      // If harmonized mode is active, use harmonized_frp if calibrated, otherwise raw frp
      const effectiveFrp = isHarmonizedMode ? (h.harmonized_frp ?? h.frp ?? 12) : (h.frp ?? 12);
      const rawFrp = h.frp ?? 12;
      const isViirs = (h.sensor || '').toUpperCase() === 'VIIRS';
      const hasHarmonization = h.harmonized_frp !== undefined && h.harmonized_frp !== null;
      const deltaFrp = hasHarmonization ? (h.harmonized_frp! - rawFrp) : 0;

      // 4-Tier Fire Regime Classification based on Effective Energy
      let color = '#00e5ff'; // Cyan default (MODIS 1km)
      let tierBadge = 'MODIS (1km) Baseline';
      let tierStyle = 'background: rgba(0, 229, 255, 0.15); color: #22d3ee; border: 1px solid rgba(0, 229, 255, 0.35);';

      if (isViirs) {
        color = '#10b981'; // Emerald (VIIRS 375m)
        tierBadge = isHarmonizedMode ? 'VIIRS (Harmonized to 1km)' : 'VIIRS (375m) Raw';
        tierStyle = 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35);';
      }

      if (effectiveFrp > 45) {
        color = '#f59e0b'; // Amber (Elevated Intensity)
        tierBadge = 'Elevated Intensity (> 45 MW)';
        tierStyle = 'background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.5);';
      }

      if (effectiveFrp > 80) {
        color = '#ef4444'; // Crimson Red (Extreme Wildfire)
        tierBadge = 'Extreme Wildfire (> 80 MW)';
        tierStyle = 'background: rgba(239, 68, 68, 0.25); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.6);';
      }

      const radius = Math.max(5, Math.min(24, Math.sqrt(effectiveFrp) * 2.3));

      const marker = L.circleMarker([h.latitude, h.longitude], {
        radius: radius,
        fillColor: color,
        fillOpacity: 0.88,
        color: '#ffffff',
        weight: 1.5,
        renderer: canvasRendererRef.current || undefined,
      });

      const popupContent = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #f8fafc; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 5px; margin-bottom: 6px;">
            <strong style="color: ${color}; font-size: 13px;">${h.sensor || 'Active Fire'}</strong>
            <span style="font-size: 10px; background: #1e293b; padding: 2px 6px; border-radius: 4px; border: 1px solid #475569; color: #94a3b8;">
              ${h.confidence || 'Nominal'}
            </span>
          </div>

          <div style="margin-bottom: 6px; padding: 3px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 600; text-align: center; ${tierStyle}">
            ${tierBadge}
          </div>

          <div style="margin-bottom: 3px;">
            <strong>${isHarmonizedMode ? 'Harmonized Energy:' : 'Radiative Power (Raw):'}</strong> 
            <span style="color: ${isHarmonizedMode ? '#38bdf8' : '#f59e0b'}; font-weight: bold; font-size: 13px;">
              ${formatFrp(effectiveFrp)}
            </span>
          </div>

          ${isHarmonizedMode && hasHarmonization && isViirs ? `
            <div style="margin-bottom: 5px; font-size: 10.5px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 6px; border-radius: 4px; color: #7dd3fc; font-family: monospace;">
              Raw Native FRP: ${formatFrp(rawFrp)} (${deltaFrp >= 0 ? '+' : ''}${deltaFrp.toFixed(1)} MW Scaled)
            </div>
          ` : ''}

          <div style="margin-bottom: 3px;"><strong>Acquired:</strong> ${formatDate(h.acq_date)}</div>
          <div style="font-size: 11px; color: #94a3b8; font-family: monospace; border-top: 1px solid #1e293b; padding-top: 4px; margin-top: 4px;">
            Lat: ${h.latitude.toFixed(4)}, Lon: ${h.longitude.toFixed(4)}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectHotspot) onSelectHotspot(h);
      });

      markers.addLayer(marker);
    });
  }, [hotspots, onSelectHotspot]);

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#090d16]">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '580px' }} />

      {/* Floating Interactive Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] pointer-events-auto">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl overflow-hidden text-xs transition-all w-72">
          {/* Header with Collapse Toggle */}
          <div
            onClick={() => setLegendExpanded(!legendExpanded)}
            className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800/60 cursor-pointer select-none hover:bg-slate-800/60 transition-colors"
          >
            <span className="font-semibold text-slate-200 tracking-wide flex items-center gap-1.5 text-[11px] uppercase">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Thermal Regime Legend
            </span>
            <button className="text-slate-400 hover:text-white p-0.5">
              {legendExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Legend Items */}
          {legendExpanded && (
            <div className="p-2.5 space-y-2">
              {/* Cyan: MODIS 1km */}
              <div className="flex items-start gap-2.5">
                <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] mt-0.5 shrink-0" />
                <div className="leading-snug">
                  <span className="font-semibold text-cyan-300 block text-[11px]">
                    MODIS (1 km)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Baseline satellite detection (FRP ≤ 45 MW)
                  </span>
                </div>
              </div>

              {/* Emerald: VIIRS 375m */}
              <div className="flex items-start gap-2.5">
                <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] mt-0.5 shrink-0" />
                <div className="leading-snug">
                  <span className="font-semibold text-emerald-300 block text-[11px]">
                    VIIRS (375 m)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    High-res active flaming perimeter (FRP ≤ 45 MW)
                  </span>
                </div>
              </div>

              {/* Amber: Elevated FRP > 45 MW */}
              <div className="flex items-start gap-2.5">
                <span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] mt-0.5 shrink-0" />
                <div className="leading-snug">
                  <span className="font-semibold text-amber-300 block text-[11px]">
                    Elevated Intensity (FRP &gt; 45 MW)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Intense active surface combustion front
                  </span>
                </div>
              </div>

              {/* Red: Extreme FRP > 80 MW */}
              <div className="flex items-start gap-2.5">
                <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse mt-0.5 shrink-0" />
                <div className="leading-snug">
                  <span className="font-semibold text-red-400 block text-[11px] flex items-center gap-1">
                    Extreme Wildfire (FRP &gt; 80 MW)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Severe crown fires & massive biomass energy
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
