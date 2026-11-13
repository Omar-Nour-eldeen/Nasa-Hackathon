import React from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  message,
  className = '',
}) => {
  const config = {
    info: {
      border: 'border-cyan-500/30 bg-cyan-950/30 text-cyan-200',
      icon: Info,
      iconColor: 'text-cyan-400',
    },
    warning: {
      border: 'border-amber-500/30 bg-amber-950/30 text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    error: {
      border: 'border-red-500/30 bg-red-950/30 text-red-200',
      icon: XCircle,
      iconColor: 'text-red-400',
    },
    success: {
      border: 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.border} ${className}`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="space-y-0.5 text-sm">
        {title && <p className="font-semibold text-white tracking-wide">{title}</p>}
        <p className="opacity-90 leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

