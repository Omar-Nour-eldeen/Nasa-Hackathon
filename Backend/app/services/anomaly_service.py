import uuid
import numpy as np
import pandas as pd
from app.storage.analytics_db import get_db_connection, query_as_dicts

class AnomalyService:
    @staticmethod
    def detect_anomalies(threshold_zscore=2.5, region=None):
        """
        Detects intense fire anomalies based on FRP Z-Score and unusual clustering.
        Deduplicates anomalies and stores them deterministically in DuckDB.
        Supports regional isolation or global multi-region detection.
        """
        con = get_db_connection()
        try:
            query = """
                SELECT id, sensor, latitude, longitude, acq_date, frp, region
                FROM observations
                WHERE frp IS NOT NULL
            """
            params = []
            if region and region.upper() not in ("ALL", "GLOBAL"):
                query += " AND UPPER(region) = ?"
                params.append(region.upper())

            df = con.execute(query, params).df() if params else con.execute(query).df()

            if df.empty:
                return {"detected": 0, "threshold_used": threshold_zscore, "anomalies": []}

            mean_frp = float(df["frp"].mean())
            std_frp = float(df["frp"].std())

            if std_frp == 0 or np.isnan(std_frp):
                std_frp = 1.0

            df["z_score"] = (df["frp"] - mean_frp) / std_frp
            anomalies_df = df[df["z_score"] >= threshold_zscore].copy()

            def classify_severity(z):
                if z > 5.0:
                    return "extreme"
                elif z > 3.5:
                    return "high"
                elif z > 2.5:
                    return "medium"
                return "low"

            anomalies_df["severity"] = anomalies_df["z_score"].apply(classify_severity)

            # Clear anomalies for this region or globally
            if region and region.upper() not in ("ALL", "GLOBAL"):
                con.execute("""
                    DELETE FROM anomalies 
                    WHERE observation_id IN (
                        SELECT id FROM observations WHERE UPPER(region) = ?
                    );
                """, [region.upper()])
            else:
                con.execute("DELETE FROM anomalies;")

            # Insert deterministic unique anomalies
            for _, row in anomalies_df.iterrows():
                anomaly_id = f"anom_{row['id']}"
                con.execute("""
                    INSERT OR REPLACE INTO anomalies (
                        id, observation_id, sensor, latitude, longitude,
                        acq_date, frp, anomaly_score, severity, anomaly_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, [
                    anomaly_id, row["id"], row["sensor"], row["latitude"],
                    row["longitude"], row["acq_date"], float(row["frp"]),
                    float(row["z_score"]), row["severity"], "extreme_frp"
                ])

            return {
                "detected": len(anomalies_df),
                "threshold_used": threshold_zscore,
                "anomalies": anomalies_df.to_dict(orient="records")
            }
        finally:
            con.close()

    @staticmethod
    def get_anomalies(limit=100, severity=None, region=None):
        query = """
            SELECT a.*, COALESCE(o.region, 'Unknown') as region
            FROM anomalies a
            LEFT JOIN observations o ON a.observation_id = o.id
            WHERE 1=1
        """
        params = []
        if region and region.upper() not in ("ALL", "GLOBAL"):
            query += " AND UPPER(o.region) = ?"
            params.append(region.upper())
        if severity and severity.upper() != "ALL":
            query += " AND a.severity = ?"
            params.append(severity.lower())
        # Fully deterministic sorting so order NEVER fluctuates on refresh
        query += " ORDER BY a.anomaly_score DESC, a.frp DESC, a.acq_date DESC, a.id ASC LIMIT ?"
        params.append(limit)
        return query_as_dicts(query, params)

    @staticmethod
    def get_statistics(region=None):
        con = get_db_connection()
        try:
            query = """
                SELECT 
                    COUNT(*) as total_anomalies,
                    COUNT(CASE WHEN a.severity = 'extreme' THEN 1 END) as extreme_severity_count,
                    COUNT(CASE WHEN a.severity = 'extreme' THEN 1 END) as extreme_count,
                    COUNT(CASE WHEN a.severity = 'high' THEN 1 END) as high_severity_count,
                    COUNT(CASE WHEN a.severity = 'high' THEN 1 END) as high_count,
                    COUNT(CASE WHEN a.severity = 'medium' THEN 1 END) as medium_count,
                    COALESCE(AVG(a.frp), 0) as avg_frp,
                    COALESCE(AVG(a.frp), 0) as avg_anomaly_frp,
                    COALESCE(MAX(a.frp), 0) as max_frp,
                    COALESCE(MAX(a.frp), 0) as max_anomaly_frp
                FROM anomalies a
                LEFT JOIN observations o ON a.observation_id = o.id
                WHERE 1=1
            """
            params = []
            if region and region.upper() not in ("ALL", "GLOBAL"):
                query += " AND UPPER(o.region) = ?"
                params.append(region.upper())

            rows = con.execute(query, params).df().to_dict(orient="records") if params else con.execute(query).df().to_dict(orient="records")
            if not rows:
                return {
                    "total_anomalies": 0,
                    "extreme_severity_count": 0,
                    "extreme_count": 0,
                    "high_severity_count": 0,
                    "high_count": 0,
                    "medium_count": 0,
                    "avg_frp": 0,
                    "avg_anomaly_frp": 0,
                    "max_frp": 0,
                    "max_anomaly_frp": 0,
                }
            return rows[0]
        finally:
            con.close()
