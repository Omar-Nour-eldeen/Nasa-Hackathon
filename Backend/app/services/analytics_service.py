from app.storage.analytics_db import get_db_connection, query_as_dicts

class AnalyticsService:
    @staticmethod
    def get_overview(region=None):
        con = get_db_connection()
        try:
            query = """
                SELECT 
                    COUNT(*) as total_observations,
                    COUNT(DISTINCT sensor) as active_sensors,
                    COALESCE(AVG(frp), 0) as average_frp,
                    COALESCE(MAX(frp), 0) as max_frp,
                    COUNT(DISTINCT acq_date) as monitored_days
                FROM observations
                WHERE 1=1
            """
            params = []
            if region and region.upper() not in ("ALL", "GLOBAL"):
                query += " AND UPPER(region) = ?"
                params.append(region.upper())

            rows = con.execute(query, params).df().to_dict(orient="records") if params else con.execute(query).df().to_dict(orient="records")
            return rows[0] if rows else {
                "total_observations": 0,
                "active_sensors": 0,
                "average_frp": 0,
                "max_frp": 0,
                "monitored_days": 0
            }
        finally:
            con.close()

    @staticmethod
    def get_hotspot_trends(period="daily", region=None):
        """Computes hotspot counts over time with regional filtering"""
        con = get_db_connection()
        try:
            if period == "monthly":
                group_col = "strftime(acq_date, '%Y-%m')"
            elif period == "yearly":
                group_col = "strftime(acq_date, '%Y')"
            else:
                group_col = "acq_date"

            query = f"""
                SELECT 
                    {group_col} as period,
                    sensor,
                    COUNT(*) as count
                FROM observations
                WHERE acq_date IS NOT NULL
            """
            params = []
            if region and region.upper() not in ("ALL", "GLOBAL"):
                query += " AND UPPER(region) = ?"
                params.append(region.upper())

            query += """
                GROUP BY 1, 2
                ORDER BY 1 ASC;
            """
            return con.execute(query, params).df().to_dict(orient="records") if params else con.execute(query).df().to_dict(orient="records")
        finally:
            con.close()

    @staticmethod
    def get_frp_trends(region=None):
        """Computes mean and sum FRP trends over time with regional filtering"""
        con = get_db_connection()
        try:
            query = """
                SELECT 
                    acq_date,
                    sensor,
                    AVG(frp) as mean_frp,
                    SUM(frp) as total_frp,
                    MAX(frp) as peak_frp
                FROM observations
                WHERE acq_date IS NOT NULL
            """
            params = []
            if region and region.upper() not in ("ALL", "GLOBAL"):
                query += " AND UPPER(region) = ?"
                params.append(region.upper())

            query += """
                GROUP BY 1, 2
                ORDER BY 1 ASC;
            """
            return con.execute(query, params).df().to_dict(orient="records") if params else con.execute(query).df().to_dict(orient="records")
        finally:
            con.close()

    @staticmethod
    def get_sensor_comparison(region=None):
        """Side-by-side comparison between MODIS and VIIRS with regional filtering"""
        con = get_db_connection()
        try:
            query = """
                SELECT 
                    sensor,
                    COUNT(*) as count,
                    AVG(frp) as avg_frp,
                    MAX(frp) as max_frp,
                    MIN(frp) as min_frp,
                    STDDEV_POP(frp) as std_frp
                FROM observations
                WHERE 1=1
            """
            params = []
            if region and region.upper() not in ("ALL", "GLOBAL"):
                query += " AND UPPER(region) = ?"
                params.append(region.upper())

            query += " GROUP BY sensor;"
            return con.execute(query, params).df().to_dict(orient="records") if params else con.execute(query).df().to_dict(orient="records")
        finally:
            con.close()

