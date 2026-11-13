import numpy as np
from app.storage.analytics_db import get_db_connection, query_as_dicts

class ValidationService:
    @staticmethod
    def get_validation_metrics():
        """Calculates overarching agreement metrics between sensors and calibrated outputs"""
        con = get_db_connection()
        try:
            # Query coincident pairs
            query = """
                SELECT 
                    m.frp AS modis_frp,
                    v.frp AS viirs_frp
                FROM observations m
                JOIN observations v 
                  ON m.acq_date = v.acq_date
                 AND ABS(m.latitude - v.latitude) < 0.035
                 AND ABS(m.longitude - v.longitude) < 0.035
                WHERE m.sensor = 'MODIS' AND v.sensor = 'VIIRS'
                  AND m.frp IS NOT NULL AND v.frp IS NOT NULL
                LIMIT 2000;
            """
            df = con.execute(query).df()
            if df.empty or len(df) < 2:
                return {
                    "sample_size": 0,
                    "mae": 0.0,
                    "rmse": 0.0,
                    "bias": 0.0,
                    "correlation": 0.0
                }

            y_true = df["modis_frp"].to_numpy()
            y_pred = df["viirs_frp"].to_numpy()

            mae = float(np.mean(np.abs(y_true - y_pred)))
            rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
            bias = float(np.mean(y_pred - y_true))
            corr = float(np.corrcoef(y_true, y_pred)[0, 1])

            return {
                "sample_size": len(df),
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "bias": round(bias, 4),
                "correlation": round(corr, 4)
            }
        finally:
            con.close()

    @staticmethod
    def get_distribution_comparison():
        """Returns histogram binning for FRP comparison between sensors"""
        con = get_db_connection()
        try:
            query = """
                SELECT 
                    sensor,
                    ROUND(frp / 10.0) * 10.0 AS frp_bin,
                    COUNT(*) as count
                FROM observations
                WHERE frp IS NOT NULL
                GROUP BY 1, 2
                ORDER BY 2 ASC;
            """
            return con.execute(query).df().to_dict(orient="records")
        finally:
            con.close()

    @staticmethod
    def get_temporal_validation():
        """Computes daily correlation and mean FRP comparison over time"""
        con = get_db_connection()
        try:
            query = """
                SELECT 
                    acq_date,
                    sensor,
                    COUNT(*) as count,
                    AVG(frp) as avg_frp
                FROM observations
                WHERE acq_date IS NOT NULL
                GROUP BY 1, 2
                ORDER BY acq_date ASC;
            """
            return con.execute(query).df().to_dict(orient="records")
        finally:
            con.close()

    @staticmethod
    def get_spatial_validation():
        """Returns regional grid error distribution"""
        con = get_db_connection()
        try:
            query = """
                SELECT 
                    ROUND(latitude, 1) as lat_grid,
                    ROUND(longitude, 1) as lon_grid,
                    COUNT(*) as total_obs,
                    AVG(frp) as mean_frp
                FROM observations
                GROUP BY 1, 2
                HAVING COUNT(*) > 5
                ORDER BY total_obs DESC;
            """
            return con.execute(query).df().to_dict(orient="records")
        finally:
            con.close()

