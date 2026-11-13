import os
from flask import Blueprint, request, send_file
from app.services.export_service import ExportService
from app.utils.response_helper import success_response, error_response

exports_bp = Blueprint("exports", __name__)

@exports_bp.route("/csv", methods=["POST"])
def export_csv():
    payload = request.get_json() or {}
    table = payload.get("table", "observations")
    limit = payload.get("limit", 10000)
    query = f"SELECT * FROM {table} LIMIT {int(limit)}"
    res = ExportService.export_to_csv(query, export_type=table)
    return success_response(res, message="CSV export generated successfully")

@exports_bp.route("/<export_id>", methods=["GET"])
def download_export(export_id):
    export_record = ExportService.get_export_file(export_id)
    if not export_record or not os.path.exists(export_record["file_path"]):
        return error_response("Export file not found or expired", status_code=404)
    return send_file(
        export_record["file_path"],
        as_attachment=True,
        download_name=export_record["file_name"],
        mimetype="text/csv"
    )

@exports_bp.route("/history", methods=["GET"])
def get_export_history():
    history = ExportService.get_history()
    return success_response(history)

@exports_bp.route("/harmonized-data", methods=["POST"])
def export_harmonized():
    query = "SELECT * FROM observations WHERE harmonized = TRUE LIMIT 10000"
    res = ExportService.export_to_csv(query, export_type="harmonized")
    return success_response(res, message="Harmonized data exported")

@exports_bp.route("/observations", methods=["POST"])
def export_observations():
    query = "SELECT * FROM observations LIMIT 20000"
    res = ExportService.export_to_csv(query, export_type="observations")
    return success_response(res, message="Observations exported")

@exports_bp.route("/validation-report", methods=["POST"])
def export_validation():
    query = "SELECT * FROM harmonization_runs LIMIT 1000"
    res = ExportService.export_to_csv(query, export_type="validation_report")
    return success_response(res, message="Validation report exported")

