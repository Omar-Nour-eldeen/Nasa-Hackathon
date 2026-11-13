# PyroScope — Satellite Active Fire Harmonization & Analytics Engine

Backend API service built with Flask for the **PyroScope** fire monitoring and sensor harmonization project (NASA Space Apps / Earth Observation).

Designed specifically for high-speed scientific data processing, statistical calibration between **MODIS** and **VIIRS**, and real-time dashboard analytics without heavy relational database or authentication overhead.

---

## 🚀 Key Architectural Highlights

1. **No External Database Overhead (Embedded DuckDB Analytics)**:
   - Uses **DuckDB** as an embedded analytical (OLAP) engine directly in `data/analytics.duckdb`.
   - Delivers lightning-fast aggregation, spatial queries, and statistical computation over millions of satellite observation records without requiring PostgreSQL or MySQL.
2. **No Authentication Gate**:
   - Clean, open RESTful APIs tailored for rapid hackathon frontend dashboard consumption.
3. **Modular Blueprints Architecture**:
   - Clean 1-to-1 mapping matching the PyroScope API Reference specification.
   - Strict separation of concerns between endpoints (`app/api`), business/ML services (`app/services`), and analytical storage (`app/storage`).
4. **Asynchronous In-Memory Job Manager**:
   - Provides background task execution, status tracking, cancellation, and logs via `/api/jobs` and `/api/processing/jobs`.

---

## 📁 Project Structure

```text
Backend/
│
├── run.py                       # Server entry point
├── requirements.txt             # Core Python dependencies
├── README.md                    # Documentation
│
├── app/
│   ├── __init__.py              # Application Factory & Blueprint Registration & CORS
│   ├── config.py                # Environment configurations & paths
│   │
│   ├── api/                     # REST API Blueprints (10 Modules)
│   │   ├── ingestion.py         # 1. Data Ingestion (/api/ingestion)
│   │   ├── observations.py      # 2. Observations (/api/observations)
│   │   ├── processing.py        # 3. Data Processing (/api/processing)
│   │   ├── harmonization.py     # 4. Sensor Harmonization (/api/harmonization)
│   │   ├── validation.py        # 5. Validation (/api/validation)
│   │   ├── anomalies.py         # 6. Anomaly Detection (/api/anomalies)
│   │   ├── analytics.py         # 7. Analytics (/api/analytics)
│   │   ├── dashboard.py         # 8. Dashboard (/api/dashboard)
│   │   ├── exports.py           # 9. Exports (/api/exports)
│   │   └── jobs.py              # 10. Background Jobs (/api/jobs)
│   │
│   ├── services/                # Business Logic, ML Models & Calibration
│   │   ├── ingestion_service.py
│   │   ├── processing_service.py
│   │   ├── harmonization_service.py
│   │   ├── validation_service.py
│   │   ├── anomaly_service.py
│   │   ├── analytics_service.py
│   │   ├── export_service.py
│   │   └── job_manager.py
│   │
│   ├── storage/                 # High-performance analytical storage
│   │   └── analytics_db.py      # DuckDB connection and SQL views
│   │
│   └── utils/                   # Helpers
│       ├── response_helper.py   # Standardized JSON response envelope
│       └── geo_helpers.py       # Haversine distance & spatial bounding
│
├── data/                        # Local data directory
│   ├── raw/                     # Uploaded raw CSV / JSON data
│   ├── processed/               # Harmonized / cleaned outputs
│   ├── exports/                 # Generated export files for download
│   └── analytics.duckdb         # Embedded DuckDB database
│
├── scripts/
│   └── seed_demo_data.py        # Generates sample MODIS & VIIRS active fire data
│
└── tests/
    └── test_api.py              # Smoke tests for API health and routes
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
py -m pip install -r requirements.txt
```

### 2. Populate Sample Data (Optional for testing)
```bash
py -m scripts.seed_demo_data
```

### 3. Run the Server
```bash
py run.py
```
Server runs by default on `http://localhost:5000`.

---

## 📡 API Endpoints Overview

| Blueprint | Route Prefix | Key Functionality |
| :--- | :--- | :--- |
| **Ingestion** | `/api/ingestion` | Import MODIS/VIIRS, upload files, sync status |
| **Observations**| `/api/observations` | View observations, filter by bounding box, date, sensor |
| **Processing** | `/api/processing` | Clean data, generate spatial grid, spatial/temporal matching |
| **Harmonization**| `/api/harmonization`| Calibrate (Ratio, Linear Regression, Quantile, Random Forest) |
| **Validation** | `/api/validation` | MAE, RMSE, Bias, Correlation metrics, distribution analysis |
| **Anomalies** | `/api/anomalies` | Statistical anomaly detection, severity classification |
| **Analytics** | `/api/analytics` | Hotspot trends, FRP trends, Land-cover & regional stats |
| **Dashboard** | `/api/dashboard` | Aggregated payloads for frontend dashboard charts & maps |
| **Exports** | `/api/exports` | Export to CSV and download reports |
| **Jobs** | `/api/jobs` | Background task status, cancellation, and logs |
| **Health** | `/api/health` | Service and analytical engine status check |

