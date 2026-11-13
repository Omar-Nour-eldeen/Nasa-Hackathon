import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label }) => {
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-amber-500 border-t-transparent`}
      />
      {label && <p className="text-xs tracking-wider text-slate-400 font-medium uppercase">{label}</p>}
    </div>
  );
};

