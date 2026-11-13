export type ColorRampType = 'viridis' | 'magma' | 'thermal' | 'accessible' | 'fire';

export interface ColorRampOption {
  id: ColorRampType;
  name: string;
  description: string;
  preview: string[];
}

export const COLOR_RAMPS: ColorRampOption[] = [
  {
    id: 'viridis',
    name: 'Viridis (Scientific Standard)',
    description: 'Perceptually uniform & colorblind-friendly. Recommended for scientific data.',
    preview: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
  },
  {
    id: 'magma',
    name: 'Magma (Deep Radiance)',
    description: 'Smooth gradient through dark purple, fire-crimson, and radiant yellow.',
    preview: ['#000004', '#51127c', '#b73779', '#fb8861', '#fcfdbf'],
  },
  {
    id: 'thermal',
    name: 'Thermal / Inferno (FRP Heat)',
    description: 'Emulates satellite infrared thermal radiance from dormant to intense active fire.',
    preview: ['#1e1b4b', '#7c2d12', '#c2410c', '#f97316', '#fef08a'],
  },
  {
    id: 'accessible',
    name: 'Cividis / High-Contrast',
    description: 'Optimized specifically for red-green and blue-yellow color vision deficiencies.',
    preview: ['#00204d', '#004c6d', '#417d84', '#7aa477', '#ffea46'],
  },
  {
    id: 'fire',
    name: 'Classic Wildfire Amber',
    description: 'Familiar danger scale from low amber to extreme combustion white-red.',
    preview: ['#1e293b', '#d97706', '#ea580c', '#dc2626', '#ffedd5'],
  },
];

// Helper to interpolate colors between 0.0 and 1.0
export function getColorForNormalizedValue(val: number, ramp: ColorRampType = 'viridis'): string {
  const clamped = Math.max(0, Math.min(1, val));
  const rampData = COLOR_RAMPS.find((r) => r.id === ramp) || COLOR_RAMPS[0];
  const colors = rampData.preview;

  if (clamped <= 0) return colors[0];
  if (clamped >= 1) return colors[colors.length - 1];

  const index = clamped * (colors.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return colors[lower];
  return colors[upper];
}

// Function to get accessible contrast text color (white or dark slate)
export function getContrastTextColor(hexColor: string): string {
  if (!hexColor.startsWith('#')) return '#ffffff';
  const c = hexColor.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  // Perceived luminance formula (ITU-R BT.709)
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 140 ? '#0f172a' : '#ffffff';
}

