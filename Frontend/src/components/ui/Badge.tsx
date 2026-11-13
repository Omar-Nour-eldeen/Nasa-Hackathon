import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'modis' | 'viirs' | 'harmonized' | 'low' | 'medium' | 'high' | 'extreme' | 'neutral' | 'success';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    modis: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    viirs: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    harmonized: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    extreme: 'bg-red-500/15 text-red-400 border-red-500/40 animate-pulse',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

