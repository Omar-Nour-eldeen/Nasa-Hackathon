from flask import Blueprint, request
from app.services.anomaly_service import AnomalyService
from app.storage.analytics_db import query_as_dicts
from app.utils.response_helper import success_response, error_response

anomalies_bp = Blueprint("anomalies", __name__)

@anomalies_bp.route("", methods=["GET"])
def list_anomalies():
    severity = request.args.get("severity")
    region = request.args.get("region")
    limit = min(int(request.args.get("limit", 100)), 1000)
    anomalies = AnomalyService.get_anomalies(limit=limit, severity=severity, region=region)
    return success_response(anomalies, count=len(anomalies))

@anomalies_bp.route("/<anomaly_id>", methods=["GET"])
def get_anomaly_detail(anomaly_id):
    records = query_as_dicts("SELECT * FROM anomalies WHERE id = ?", [anomaly_id])
    if not records:
        return error_response("Anomaly not found", status_code=404)
    return success_response(records[0])

@anomalies_bp.route("/detect", methods=["POST"])
def detect_anomalies():
    payload = request.get_json() or {}
    threshold = float(payload.get("threshold_zscore", 2.5))
    region = payload.get("region")
    res = AnomalyService.detect_anomalies(threshold_zscore=threshold, region=region)
    return success_response(res, message=f"Detected {res['detected']} anomalies")

@anomalies_bp.route("/by-region", methods=["GET"])
def anomalies_by_region():
    res = query_as_dicts("""
        SELECT 
            ROUND(latitude, 0) as lat_zone,
            ROUND(longitude, 0) as lon_zone,
            COUNT(*) as anomaly_count,
            AVG(frp) as avg_anomaly_frp
        FROM anomalies
        GROUP BY 1, 2
        ORDER BY anomaly_count DESC;
    """)
    return success_response(res)

@anomalies_bp.route("/by-date", methods=["GET"])
def anomalies_by_date():
    region = request.args.get("region")
    query = """
        SELECT 
            a.acq_date,
            COUNT(*) as count,
            AVG(a.frp) as avg_frp
        FROM anomalies a
        LEFT JOIN observations o ON a.observation_id = o.id
        WHERE a.acq_date IS NOT NULL
    """
    params = []
    if region and region.upper() not in ("ALL", "GLOBAL"):
        query += " AND UPPER(o.region) = ?"
        params.append(region.upper())

    query += " GROUP BY a.acq_date ORDER BY a.acq_date ASC;"
    res = query_as_dicts(query, params)
    return success_response(res)

@anomalies_bp.route("/map", methods=["GET"])
def anomalies_map():
    region = request.args.get("region")
    query = """
        SELECT a.id, a.sensor, a.latitude, a.longitude, a.frp, a.severity, a.anomaly_score, a.acq_date,
               COALESCE(o.region, 'Unknown') as region
        FROM anomalies a
        LEFT JOIN observations o ON a.observation_id = o.id
        WHERE 1=1
    """
    params = []
    if region and region.upper() not in ("ALL", "GLOBAL"):
        query += " AND UPPER(o.region) = ?"
        params.append(region.upper())
    query += " LIMIT 1000;"
    res = query_as_dicts(query, params)
    return success_response(res)

@anomalies_bp.route("/statistics", methods=["GET"])
def anomalies_statistics():
    region = request.args.get("region")
    stats = AnomalyService.get_statistics(region=region)
    return success_response(stats)

@anomalies_bp.route("/severity", methods=["GET"])
def anomalies_severity():
    region = request.args.get("region")
    query = """
        SELECT 
            a.severity,
            COUNT(*) as count,
            AVG(a.frp) as mean_frp,
            MAX(a.frp) as max_frp
        FROM anomalies a
        LEFT JOIN observations o ON a.observation_id = o.id
        WHERE 1=1
    """
    params = []
    if region and region.upper() not in ("ALL", "GLOBAL"):
        query += " AND UPPER(o.region) = ?"
        params.append(region.upper())

    query += " GROUP BY a.severity;"
    res = query_as_dicts(query, params)
    return success_response(res)

