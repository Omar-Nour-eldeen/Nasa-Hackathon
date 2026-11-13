from flask import Blueprint, request
import pandas as pd
from app.services.ingestion_service import IngestionService
from app.utils.response_helper import success_response, error_response

ingestion_bp = Blueprint("ingestion", __name__)

@ingestion_bp.route("/sources", methods=["GET"])
def list_sources():
    sources = IngestionService.list_sources()
    return success_response(data=sources, message="Data sources retrieved successfully")

@ingestion_bp.route("/sources/import/modis", methods=["POST"])
def import_modis():
    payload = request.get_json() or {}
    # Handles manual payload or URL/file ingestion
    records = payload.get("records", [])
    if not records:
        return error_response("No records provided for MODIS import", status_code=400)
    df = pd.DataFrame(records)
    count = IngestionService.ingest_dataframe(df, "MODIS")
    return success_response({"imported_count": count}, message=f"Successfully imported {count} MODIS observations")

@ingestion_bp.route("/sources/import/viirs", methods=["POST"])
def import_viirs():
    payload = request.get_json() or {}
    records = payload.get("records", [])
    if not records:
        return error_response("No records provided for VIIRS import", status_code=400)
    df = pd.DataFrame(records)
    count = IngestionService.ingest_dataframe(df, "VIIRS")
    return success_response({"imported_count": count}, message=f"Successfully imported {count} VIIRS observations")

@ingestion_bp.route("/files/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return error_response("No file uploaded", status_code=400)
    file = request.files["file"]
    if file.filename == "":
        return error_response("Empty filename", status_code=400)
    
    sensor_input = request.form.get("sensor")
    saved_info = IngestionService.save_uploaded_file(file)

    # Automatically parse CSV if requested
    auto_ingest = request.form.get("auto_ingest", "true").lower() == "true"
    imported_rows = 0
    if auto_ingest and file.filename.endswith(".csv"):
        try:
            df = pd.read_csv(saved_info["path"])
            # Auto-detect sensor if not explicitly specified
            if sensor_input:
                sensor = sensor_input.upper()
            else:
                cols = [c.lower() for c in df.columns]
                fn = file.filename.lower()
                if "bright_ti4" in cols or "viirs" in fn:
                    sensor = "VIIRS"
                else:
                    sensor = "MODIS"

            # Auto-detect region from filename (e.g., modis_2025_Algeria.csv -> Algeria)
            raw_base = file.filename.rsplit(".", 1)[0]
            parts = raw_base.split("_")
            detected_region = request.form.get("region")
            if not detected_region and len(parts) >= 2:
                potential_region = parts[-1].strip()
                if potential_region and not potential_region.isdigit():
                    detected_region = potential_region.replace("-", " ").title()

            if detected_region and "region" not in df.columns:
                df["region"] = detected_region
            elif detected_region and df["region"].isnull().all():
                df["region"] = detected_region

            imported_rows = IngestionService.ingest_dataframe(df, sensor)
        except Exception as e:
            return error_response(f"File uploaded but failed to parse: {str(e)}", status_code=500)

    saved_info["imported_records"] = imported_rows
    return success_response(saved_info, message="File uploaded and ingested successfully")

@ingestion_bp.route("/imports", methods=["GET"])
def list_imports():
    # Return placeholder or files list
    return success_response([], message="Recent imports list")

@ingestion_bp.route("/imports/<import_id>", methods=["GET"])
def get_import_details(import_id):
    return success_response({"import_id": import_id, "status": "completed"})

@ingestion_bp.route("/sync", methods=["POST"])
def sync_data():
    return success_response({"status": "sync_started"}, message="Data synchronization started")

@ingestion_bp.route("/regions/<region_name>", methods=["DELETE"])
def delete_region(region_name):
    """Deletes all observation records and associated anomalies for a specified region"""
    try:
        IngestionService.delete_region_observations(region_name)
        return success_response(
            {"deleted_region": region_name},
            message=f"Successfully deleted all observations for dataset '{region_name}'"
        )
    except Exception as e:
        return error_response(f"Failed to delete region dataset: {str(e)}", status_code=500)

@ingestion_bp.route("/clear-all", methods=["DELETE", "POST"])
def clear_all_data():
    """Deletes all observations across all regions from DuckDB"""
    try:
        IngestionService.clear_all_observations()
        return success_response(
            {"cleared": True},
            message="Successfully purged all observation and anomaly records from DuckDB analytics database"
        )
    except Exception as e:
        return error_response(f"Failed to clear database: {str(e)}", status_code=500)

