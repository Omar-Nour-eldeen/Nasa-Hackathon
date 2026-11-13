import duckdb
from app.config import Config

def get_db_connection():
    """Returns a DuckDB connection to the local analytical database"""
    Config.ensure_directories()
    con = duckdb.connect(Config.ANALYTICS_DB_PATH)
    return con

def init_analytics_db():
    """Initializes tables and indexes for high-speed analysis and geospatial fire queries"""
    con = get_db_connection()
    try:
        # Table: Observations (MODIS & VIIRS raw and filtered fire hotspots)
        con.execute("""
            CREATE TABLE IF NOT EXISTS observations (
                id VARCHAR PRIMARY KEY,
                sensor VARCHAR NOT NULL,          -- 'MODIS' or 'VIIRS'
                latitude DOUBLE NOT NULL,
                longitude DOUBLE NOT NULL,
                brightness DOUBLE,
                scan DOUBLE,
                track DOUBLE,
                acq_date DATE,
                acq_time VARCHAR,
                satellite VARCHAR,
                confidence VARCHAR,
                version VARCHAR,
                bright_t31 DOUBLE,
                frp DOUBLE,                       -- Fire Radiative Power (MW)
                daynight VARCHAR,
                region VARCHAR,
                land_cover VARCHAR,
                harmonized BOOLEAN DEFAULT FALSE,
                harmonized_frp DOUBLE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Table: Harmonization Runs and Metrics
        con.execute("""
            CREATE TABLE IF NOT EXISTS harmonization_runs (
                id VARCHAR PRIMARY KEY,
                method VARCHAR NOT NULL,          -- 'ratio', 'linear_regression', 'quantile_mapping', 'random_forest'
                status VARCHAR DEFAULT 'completed',
                target_sensor VARCHAR DEFAULT 'VIIRS',
                reference_sensor VARCHAR DEFAULT 'MODIS',
                samples_count INTEGER,
                metrics_mae DOUBLE,
                metrics_rmse DOUBLE,
                metrics_bias DOUBLE,
                metrics_correlation DOUBLE,
                parameters JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Table: Detected Fire Anomalies
        con.execute("""
            CREATE TABLE IF NOT EXISTS anomalies (
                id VARCHAR PRIMARY KEY,
                observation_id VARCHAR,
                sensor VARCHAR,
                latitude DOUBLE,
                longitude DOUBLE,
                acq_date DATE,
                frp DOUBLE,
                anomaly_score DOUBLE,
                severity VARCHAR,                 -- 'low', 'medium', 'high', 'extreme'
                anomaly_type VARCHAR,
                detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Table: Export History
        con.execute("""
            CREATE TABLE IF NOT EXISTS export_history (
                id VARCHAR PRIMARY KEY,
                file_name VARCHAR,
                file_type VARCHAR,
                file_path VARCHAR,
                record_count INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

    finally:
        con.close()

def query_as_dicts(query: str, params: list = None):
    """Executes a SQL query on the analytics DB and returns rows as a list of dicts"""
    con = get_db_connection()
    try:
        if params:
            df = con.execute(query, params).df()
        else:
            df = con.execute(query).df()
        # Convert NaN to None for clean JSON serialization
        return df.where(df.notnull(), None).to_dict(orient="records")
    finally:
        con.close()

