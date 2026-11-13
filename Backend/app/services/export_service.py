import os
import uuid
import pandas as pd
from app.config import Config
from app.storage.analytics_db import get_db_connection, query_as_dicts

class ExportService:
    @staticmethod
    def export_to_csv(query: str, export_type="observations", params=None):
        """Executes a query and writes the result to a CSV file in data/exports"""
        Config.ensure_directories()
        con = get_db_connection()
        try:
            if params:
                df = con.execute(query, params).df()
            else:
                df = con.execute(query).df()

            export_id = str(uuid.uuid4())[:8]
            filename = f"export_{export_type}_{export_id}.csv"
            filepath = Config.EXPORTS_DIR / filename
            df.to_csv(filepath, index=False)

            # Record in export history table
            con.execute("""
                INSERT INTO export_history (id, file_name, file_type, file_path, record_count)
                VALUES (?, ?, ?, ?, ?);
            """, [export_id, filename, export_type, str(filepath), len(df)])

            return {
                "export_id": export_id,
                "file_name": filename,
                "record_count": len(df),
                "download_url": f"/api/exports/{export_id}"
            }
        finally:
            con.close()

    @staticmethod
    def get_export_file(export_id: str):
        con = get_db_connection()
        try:
            res = con.execute("SELECT * FROM export_history WHERE id = ?", [export_id]).fetchone()
            if not res:
                return None
            return {
                "id": res[0],
                "file_name": res[1],
                "file_type": res[2],
                "file_path": res[3],
                "record_count": res[4]
            }
        finally:
            con.close()

    @staticmethod
    def get_history():
        return query_as_dicts("SELECT * FROM export_history ORDER BY created_at DESC;")

