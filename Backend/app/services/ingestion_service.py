import os
import uuid
import pandas as pd
from app.config import Config
from app.storage.analytics_db import get_db_connection

class IngestionService:
    @staticmethod
    def list_sources():
        return [
            {
                "id": "modis",
                "name": "MODIS (Terra & Aqua)",
                "resolution": "1km",
                "status": "ready",
                "description": "Moderate Resolution Imaging Spectroradiometer fire products"
            },
            {
                "id": "viirs",
                "name": "VIIRS (Suomi NPP & NOAA-20)",
                "resolution": "375m",
                "status": "ready",
                "description": "Visible Infrared Imaging Radiometer Suite active fire data"
            }
        ]

    @staticmethod
    def save_uploaded_file(file_storage):
        """Save an uploaded CSV/JSON file to the raw data directory"""
        filename = file_storage.filename
        file_id = str(uuid.uuid4())[:8]
        safe_name = f"{file_id}_{filename}"
        dest_path = Config.RAW_DATA_DIR / safe_name
        file_storage.save(str(dest_path))
        return {
            "file_id": file_id,
            "filename": filename,
            "saved_as": safe_name,
            "path": str(dest_path),
            "size_bytes": os.path.getsize(dest_path)
        }

    @staticmethod
    def ingest_dataframe(df: pd.DataFrame, sensor_name: str):
        """Inserts observation rows into DuckDB analytics table with full NASA FIRMS column support"""
        con = get_db_connection()
        try:
            # Normalize column names to lowercase
            df.columns = [c.strip().lower() for c in df.columns]

            # Handle VIIRS specific column names
            if "bright_ti4" in df.columns and "brightness" not in df.columns:
                df["brightness"] = df["bright_ti4"]
            if "bright_ti5" in df.columns and "bright_t31" not in df.columns:
                df["bright_t31"] = df["bright_ti5"]

            # Ensure minimal required columns exist
            if "latitude" not in df.columns or "longitude" not in df.columns:
                raise ValueError("Dataset must contain 'latitude' and 'longitude' columns.")

            records_count = len(df)
            df["sensor"] = sensor_name.upper()
            if "id" not in df.columns:
                df["id"] = [str(uuid.uuid4()) for _ in range(records_count)]

            # Ensure all table columns exist in dataframe or default to None
            optional_cols = [
                "brightness", "scan", "track", "acq_date", "acq_time",
                "satellite", "confidence", "version", "bright_t31", "frp",
                "daynight", "region", "land_cover"
            ]
            for col in optional_cols:
                if col not in df.columns:
                    df[col] = None

            # Register temporary view and insert with full columns
            con.register("temp_df", df)
            con.execute("""
                INSERT OR REPLACE INTO observations (
                    id, sensor, latitude, longitude,
                    brightness, scan, track, acq_date, acq_time,
                    satellite, confidence, version, bright_t31,
                    frp, daynight, region, land_cover
                )
                SELECT 
                    CAST(id AS VARCHAR),
                    CAST(sensor AS VARCHAR),
                    CAST(latitude AS DOUBLE),
                    CAST(longitude AS DOUBLE),
                    TRY_CAST(brightness AS DOUBLE),
                    TRY_CAST(scan AS DOUBLE),
                    TRY_CAST(track AS DOUBLE),
                    TRY_CAST(acq_date AS DATE),
                    CAST(acq_time AS VARCHAR),
                    CAST(satellite AS VARCHAR),
                    CAST(confidence AS VARCHAR),
                    CAST(version AS VARCHAR),
                    TRY_CAST(bright_t31 AS DOUBLE),
                    TRY_CAST(frp AS DOUBLE),
                    CAST(daynight AS VARCHAR),
                    CAST(region AS VARCHAR),
                    CAST(land_cover AS VARCHAR)
                FROM temp_df;
            """)
            return records_count
        finally:
            con.close()

    @staticmethod
    def delete_region_observations(region_name: str):
        """Deletes all observations and associated anomalies for a specific region"""
        con = get_db_connection()
        try:
            con.execute("DELETE FROM observations WHERE UPPER(region) = UPPER(?);", [region_name])
            con.execute("DELETE FROM anomalies WHERE observation_id NOT IN (SELECT id FROM observations);")
            return True
        finally:
            con.close()

    @staticmethod
    def clear_all_observations():
        """Clears all observations and anomalies from DuckDB"""
        con = get_db_connection()
        try:
            con.execute("DELETE FROM observations;")
            con.execute("DELETE FROM anomalies;")
            return True
        finally:
            con.close()
