# PyroScope — Harmonized Active Fire & Burning Activity Calendar

Frontend application built with **React + Vite + TypeScript + Tailwind CSS** using **Feature-Based Architecture** for the NASA Space Apps Earth Observation Fire Regime Challenge.

PyroScope harmonizes more than two decades of **MODIS** (Terra & Aqua, 1km) historical active fire observations with high-resolution **VIIRS** (S-NPP & JPSS-1/NOAA-20, 375m) continuity, providing emergency managers, firefighters, land stewards, and climate scientists with an accessible, interactive burning activity calendar.

---

## 🚀 Architectural Design: Feature-Based Architecture

The frontend follows a modular, scalable **Feature-Based Architecture** where each domain capability encapsulates its own components, hooks, views, and data contracts:

```text
Frontend/src/
├── features/
│   ├── calendar/                  # 1. Burning Activity Calendar (Core Challenge)
│   │   ├── components/
│   │   │   ├── BurningCalendarMatrix.tsx   # Year x Month heat matrix with accessible color ramps
│   │   │   ├── HistoricalMedianChart.tsx   # Active year vs 20-year baseline median & envelope
│   │   │   └── ColorRampSelector.tsx       # Scientific color ramps (Viridis, Magma, Cividis, Turbo)
│   │   └── CalendarView.tsx                # Master calendar dashboard & CSV export
│   │
│   ├── map/                       # 2. Geospatial Active Fire Explorer
│   │   ├── components/
│   │   │   ├── FireMap.tsx                 # Leaflet interactive map with FRP heat circles
│   │   │   └── BoundingBoxControl.tsx      # Area of Interest (AOI) lat/lon envelope & presets
│   │   └── MapView.tsx                     # Map, layer switch (Satellite/Dark), telemetry inspector
│   │
│   ├── harmonization/             # 3. MODIS-VIIRS Harmonization Workbench
│   │   ├── components/
│   │   │   ├── CalibrationCard.tsx         # Linear Regression, Quantile, Ratio, Random Forest
│   │   │   ├── MetricsComparison.tsx       # MAE, RMSE, Bias, and Pearson Correlation (r)
│   │   │   ├── CalibrationScatterPlot.tsx  # Paired MODIS vs VIIRS FRP scatter & fit curve
│   │   │   └── ActivityIndexChart.tsx      # Harmonized Activity Index (HAI) time series
│   │   └── HarmonizationView.tsx           # Model training & DuckDB calibration execution
│   │
│   ├── anomalies/                 # 4. Extreme Thermal Anomalies & Outlier Engine
│   │   ├── components/
│   │   │   └── AnomalyDetectorControl.tsx  # Z-score slider (1.5 - 4.0σ) & live detection scan
│   │   └── AnomaliesView.tsx               # Severity breakdown (Low/Med/High/Extreme) & alert feed
│   │
│   ├── analytics/                 # 5. Fire Regimes & Multi-Decadal Sensor Trends
│   │   └── AnalyticsView.tsx               # Daily/Monthly/Yearly curves, Land-cover & Regional stats
│   │
│   ├── ingestion/                 # 6. NASA FIRMS Data Pipeline & Processing
│   │   └── IngestionView.tsx               # Drag & drop CSV ingestion, spatial matching, async jobs
│   │
│   ├── exports/                   # 7. Analytical Exports & CSV Center
│   │   └── ExportsView.tsx                 # One-click CSV downloads for GIS (QGIS/ArcGIS)
│   │
│   └── dashboard/                 # 8. Mission Control Overview
│       └── DashboardOverview.tsx           # Real-time KPIs, mini calendar, map & alert highlights
│
├── components/                    # Reusable Shared UI Components
│   ├── layout/
│   │   ├── Navbar.tsx             # Header with sys time, engine health, sensor specs
│   │   ├── Sidebar.tsx            # Feature drawer navigation with badge counts
│   │   └── Footer.tsx             # Mission credentials & NASA FIRMS attribution
│   └── ui/
│       ├── StatCard.tsx
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       └── Spinner.tsx
│
├── services/                      # REST API Clients connecting to Backend (Port 5000)
│   ├── api.ts                     # Axios base instance & error interceptor
│   ├── dashboardService.ts        # /api/dashboard/*
│   ├── observationService.ts      # /api/observations/*
│   ├── harmonizationService.ts    # /api/harmonization/*
│   ├── anomalyService.ts          # /api/anomalies/*
│   ├── analyticsService.ts        # /api/analytics/*
│   ├── ingestionService.ts        # /api/ingestion/* and /api/processing/*
│   ├── exportService.ts           # /api/exports/*
│   └── jobService.ts              # /api/jobs/*
│
├── types/                         # TypeScript Contracts & Data Models
├── utils/                         # Color ramps (Viridis, Magma, Cividis), formatters, BBox presets
└── App.tsx                        # Root application shell & routing
```

---

## 🎯 Alignment with Challenge Objectives

| Objective | PyroScope Implementation |
| :--- | :--- |
| **Harmonized Burning Calendar** | Complete Year × Month heat matrix from 2000s to 2026. Cells display hotspot counts and radiative intensity (FRP). |
| **Historical Median Comparison** | `HistoricalMedianChart` compares the current year against the 20-year monthly historical median with min/max shaded envelope. |
| **Accessible Color Ramps** | Live switchable color scales: **Viridis** (perceptually uniform), **Magma** (high thermal radiance), **Cividis** (optimized for color vision deficiency), and **Thermal Inferno**. |
| **MODIS & VIIRS Harmonization** | 4 calibration algorithms: **Ratio**, **Linear Regression (OLS)**, **Quantile Mapping (CDF transfer)**, and **Random Forest Regressor**. |
| **Statistical Goodness-of-Fit** | Real-time calculation of **MAE**, **RMSE**, **Systematic Bias**, and **Pearson Correlation (r)**. |
| **Interactive Hotspot Map** | Leaflet map with custom FRP heat circles, Area of Interest (AOI) bounding box input, California / Mediterranean / Amazon presets, and dark/satellite tile layers. |
| **Downloadable CSV Output** | Direct CSV generation and download for calendar data, AOI hotspots, harmonized dataset, and validation reports. |
| **Statistical Anomaly Detection** | Z-score threshold slider (1.5σ to 4.0σ) with severity ranking (Low, Medium, High, Extreme). |
| **Full Backend Integration** | Connects to all 10 Flask REST blueprints powered by DuckDB analytical OLAP engine. |

---

## 💻 Quick Start

### 1. Start Backend (if not already running)
```bash
cd Backend
py run.py
```
Backend runs on `http://localhost:5000`.

### 2. Run Frontend
```bash
cd Frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
