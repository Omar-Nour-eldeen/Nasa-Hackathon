import React from 'react';
import { Satellite, Shield, Globe2, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-6 px-4 sm:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Globe2 className="w-4 h-4 text-amber-500" />
          <span>
            <strong className="text-slate-300">PyroScope</strong> — Harmonized Active Fire & Burning Activity Calendar
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">NASA Earthdata FIRMS Active Fire System</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Satellite className="w-3.5 h-3.5 text-blue-400" /> MODIS Terra/Aqua
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Satellite className="w-3.5 h-3.5 text-emerald-400" /> VIIRS S-NPP / JPSS
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> Emergency Management Ready
          </span>
        </div>
      </div>
    </footer>
  );
};

