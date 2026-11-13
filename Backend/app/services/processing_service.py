import numpy as np
import pandas as pd
from app.storage.analytics_db import get_db_connection, query_as_dicts
from app.utils.geo_helpers import haversine_distance

class ProcessingService:
    @staticmethod
    def clean_data():
        """Cleans erroneous observations (invalid coordinates, negative FRP, etc.)"""
        con = get_db_connection()
        try:
            res = con.execute("""
                DELETE FROM observations
                WHERE latitude < -90 OR latitude > 90
                   OR longitude < -180 OR longitude > 180
                   OR frp < 0;
            """)
            return {"cleaned_rows": res.fetchone()[0] if res else 0}
        finally:
            con.close()

    @staticmethod
    def filter_observations(sensor=None, min_frp=None, start_date=None, end_date=None, confidence=None):
        """Query filtered observations directly from the analytics engine"""
        query = "SELECT * FROM observations WHERE 1=1"
        params = []

        if sensor:
            query += " AND UPPER(sensor) = ?"
            params.append(sensor.upper())
        if min_frp is not None:
            query += " AND frp >= ?"
            params.append(float(min_frp))
        if start_date:
            query += " AND acq_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND acq_date <= ?"
            params.append(end_date)
        if confidence:
            query += " AND confidence = ?"
            params.append(confidence)

        query += " LIMIT 1000"
        return query_as_dicts(query, params)

    @staticmethod
    def generate_spatial_grid(grid_size=0.1):
        """Generates spatial aggregation grid cells for heatmaps and model training"""
        con = get_db_connection()
        try:
            query = f"""
                SELECT 
                    ROUND(latitude / {grid_size}) * {grid_size} AS grid_lat,
                    ROUND(longitude / {grid_size}) * {grid_size} AS grid_lon,
                    sensor,
                    COUNT(*) AS hotspot_count,
                    AVG(frp) AS avg_frp,
                    MAX(frp) AS max_frp,
                    SUM(frp) AS total_frp
                FROM observations
                GROUP BY 1, 2, 3
                ORDER BY hotspot_count DESC;
            """
            return con.execute(query).df().to_dict(orient="records")
        finally:
            con.close()

    @staticmethod
    def match_spatial_temporal(max_distance_km=1.5, max_time_diff_hours=2.0):
        """Matches coincident MODIS and VIIRS observations for harmonization calibration"""
        # Queries coincident points for calibration
        con = get_db_connection()
        try:
            query = """
                SELECT 
                    m.id AS modis_id,
                    v.id AS viirs_id,
                    m.latitude AS modis_lat,
                    m.longitude AS modis_lon,
                    v.latitude AS viirs_lat,
                    v.longitude AS viirs_lon,
                    m.frp AS modis_frp,
                    v.frp AS viirs_frp,
                    m.acq_date AS date
                FROM observations m
                JOIN observations v 
                  ON m.sensor = 'MODIS' 
                 AND v.sensor = 'VIIRS'
                 AND m.acq_date = v.acq_date
                 AND ABS(m.latitude - v.latitude) < 0.02
                 AND ABS(m.longitude - v.longitude) < 0.02
                LIMIT 500;
            """
            return con.execute(query).df().to_dict(orient="records")
        finally:
            con.close()

