import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: 'amber' | 'red' | 'blue' | 'emerald' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'amber',
}) => {
  const colorMap = {
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      accent: 'from-amber-500/5',
    },
    red: {
      border: 'border-red-500/20 hover:border-red-500/40',
      iconBg: 'bg-red-500/10 text-red-400',
      accent: 'from-red-500/5',
    },
    blue: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      accent: 'from-cyan-500/5',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      accent: 'from-emerald-500/5',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400',
      accent: 'from-purple-500/5',
    },
  };

  const styling = colorMap[color];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-200 ${styling.border} bg-gradient-to-br ${styling.accent} to-transparent`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">{title}</p>
          <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${styling.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center text-xs">
          <span
            className={`font-medium ${
              trend.isPositive ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {trend.value}
          </span>
          <span className="ml-1.5 text-slate-500">vs historical median</span>
        </div>
      )}
    </div>
  );
};

