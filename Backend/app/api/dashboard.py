from flask import Blueprint, request
from app.services.analytics_service import AnalyticsService
from app.services.anomaly_service import AnomalyService
from app.services.harmonization_service import HarmonizationService
from app.storage.analytics_db import query_as_dicts
from app.utils.response_helper import success_response

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/overview", methods=["GET"])
def dashboard_overview():
    region = request.args.get("region")
    stats = AnalyticsService.get_overview(region=region)
    anomaly_stats = AnomalyService.get_statistics(region=region)
    return success_response({
        "observations": stats,
        "anomalies": anomaly_stats
    })

@dashboard_bp.route("/map", methods=["GET"])
def dashboard_map():
    limit = min(int(request.args.get("limit", 1000)), 5000)
    region = request.args.get("region")
    query = """
        SELECT id, sensor, latitude, longitude, frp, harmonized_frp, harmonized, acq_date, confidence, region
        FROM observations
        WHERE 1=1
    """
    params = []
    if region and region.upper() not in ("ALL", "GLOBAL"):
        query += " AND UPPER(region) = ?"
        params.append(region.upper())

    query += " ORDER BY acq_date DESC LIMIT ?"
    params.append(limit)
    res = query_as_dicts(query, params)
    return success_response(res)

@dashboard_bp.route("/calendar", methods=["GET"])
def dashboard_calendar():
    region = request.args.get("region")
    query = """
        SELECT 
            acq_date as date,
            COUNT(*) as fire_count,
            AVG(frp) as intensity
        FROM observations
        WHERE acq_date IS NOT NULL
    """
    params = []
    if region and region.upper() not in ("ALL", "GLOBAL"):
        query += " AND UPPER(region) = ?"
        params.append(region.upper())

    query += """
        GROUP BY acq_date
        ORDER BY acq_date ASC;
    """
    res = query_as_dicts(query, params)
    return success_response(res)

@dashboard_bp.route("/anomalies", methods=["GET"])
def dashboard_anomalies():
    region = request.args.get("region")
    recent_anomalies = AnomalyService.get_anomalies(limit=10, region=region)
    stats = AnomalyService.get_statistics(region=region)
    return success_response({
        "summary": stats,
        "recent": recent_anomalies
    })

@dashboard_bp.route("/trends", methods=["GET"])
def dashboard_trends():
    region = request.args.get("region")
    trends = AnalyticsService.get_hotspot_trends(region=region)
    frp_trends = AnalyticsService.get_frp_trends(region=region)
    return success_response({
        "counts": trends,
        "frp": frp_trends
    })

@dashboard_bp.route("/sensor-comparison", methods=["GET"])
def dashboard_sensor_comparison():
    region = request.args.get("region")
    comp = AnalyticsService.get_sensor_comparison(region=region)
    return success_response(comp)

@dashboard_bp.route("/activity-index", methods=["GET"])
def dashboard_activity_index():
    index = HarmonizationService.calculate_activity_index()
    return success_response(index)

