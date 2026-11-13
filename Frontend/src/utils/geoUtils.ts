export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export const PRESET_REGIONS: Record<string, { name: string; bbox: BoundingBox; center: [number, number]; zoom: number }> = {
  GLOBAL: {
    name: 'Global / Wide View',
    bbox: { minLat: -60, maxLat: 70, minLon: -180, maxLon: 180 },
    center: [20, 0],
    zoom: 2,
  },
  ALGERIA: {
    name: 'Algeria (Uploaded Dataset)',
    bbox: { minLat: 19.0, maxLat: 37.5, minLon: -8.5, maxLon: 12.0 },
    center: [28.5, 3.0],
    zoom: 5,
  },
  ALBANIA: {
    name: 'Albania (Uploaded Dataset)',
    bbox: { minLat: 39.5, maxLat: 42.7, minLon: 19.0, maxLon: 21.5 },
    center: [41.15, 20.15],
    zoom: 7,
  },
  AFGHANISTAN: {
    name: 'Afghanistan (Uploaded Dataset)',
    bbox: { minLat: 29.0, maxLat: 39.0, minLon: 60.0, maxLon: 75.0 },
    center: [33.8, 66.0],
    zoom: 6,
  },
  MEDITERRANEAN: {
    name: 'Mediterranean Basin (Southern Europe)',
    bbox: { minLat: 34.0, maxLat: 45.0, minLon: -10.0, maxLon: 36.0 },
    center: [39.0, 15.0],
    zoom: 5,
  },
  AMAZON: {
    name: 'Amazon Rainforest (Brazil / Bolivia)',
    bbox: { minLat: -18.0, maxLat: 5.0, minLon: -74.0, maxLon: -44.0 },
    center: [-8.0, -55.0],
    zoom: 5,
  },
  AUSTRALIA: {
    name: 'Southeast Australia (Bushfire Corridor)',
    bbox: { minLat: -39.0, maxLat: -27.0, minLon: 140.0, maxLon: 154.0 },
    center: [-33.0, 147.0],
    zoom: 6,
  },
};

export function exportArrayToCsvFile(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && val.includes(',')) return `"${val.replace(/"/g, '""')}"`;
          return String(val);
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

