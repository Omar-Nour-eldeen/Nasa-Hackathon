from flask import Blueprint, request
from app.services.analytics_service import AnalyticsService
from app.services.harmonization_service import HarmonizationService
from app.storage.analytics_db import query_as_dicts
from app.utils.response_helper import success_response

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/overview", methods=["GET"])
def get_overview():
    region = request.args.get("region")
    overview = AnalyticsService.get_overview(region=region)
    return success_response(overview)

@analytics_bp.route("/hotspot-trends", methods=["GET"])
def get_hotspot_trends():
    period = request.args.get("period", "daily")
    region = request.args.get("region")
    trends = AnalyticsService.get_hotspot_trends(period=period, region=region)
    return success_response(trends)

@analytics_bp.route("/frp-trends", methods=["GET"])
def get_frp_trends():
    region = request.args.get("region")
    trends = AnalyticsService.get_frp_trends(region=region)
    return success_response(trends)

@analytics_bp.route("/activity-trends", methods=["GET"])
def get_activity_trends():
    activity = HarmonizationService.calculate_activity_index()
    return success_response(activity)

@analytics_bp.route("/daily", methods=["GET"])
def get_daily():
    region = request.args.get("region")
    trends = AnalyticsService.get_hotspot_trends(period="daily", region=region)
    return success_response(trends)

@analytics_bp.route("/monthly", methods=["GET"])
def get_monthly():
    region = request.args.get("region")
    trends = AnalyticsService.get_hotspot_trends(period="monthly", region=region)
    return success_response(trends)

@analytics_bp.route("/yearly", methods=["GET"])
def get_yearly():
    region = request.args.get("region")
    trends = AnalyticsService.get_hotspot_trends(period="yearly", region=region)
    return success_response(trends)

@analytics_bp.route("/regions", methods=["GET"])
def get_regions():
    res = query_as_dicts("""
        SELECT 
            COALESCE(region, 'Global') as region,
            COUNT(*) as hotspot_count,
            AVG(frp) as avg_frp,
            SUM(frp) as total_frp
        FROM observations
        GROUP BY 1
        ORDER BY hotspot_count DESC;
    """)
    return success_response(res)

@analytics_bp.route("/land-cover", methods=["GET"])
def get_land_cover():
    res = query_as_dicts("""
        SELECT 
            COALESCE(land_cover, 'Forest/Vegetation') as land_cover,
            COUNT(*) as hotspot_count,
            AVG(frp) as avg_frp
        FROM observations
        GROUP BY 1
        ORDER BY hotspot_count DESC;
    """)
    return success_response(res)

@analytics_bp.route("/sensor-comparison", methods=["GET"])
def get_sensor_comparison():
    region = request.args.get("region")
    comp = AnalyticsService.get_sensor_comparison(region=region)
    return success_response(comp)

