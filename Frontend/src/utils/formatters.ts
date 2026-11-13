export function formatNumber(val?: number | null, decimals = 0): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatFrp(mw?: number | null): string {
  if (mw === undefined || mw === null || isNaN(mw)) return '0.0 MW';
  return `${mw.toFixed(1)} MW`;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatPercent(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0%';
  return `${(val * 100).toFixed(1)}%`;
}

