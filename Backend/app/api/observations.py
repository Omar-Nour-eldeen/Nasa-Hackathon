from flask import Blueprint, request
from app.storage.analytics_db import query_as_dicts
from app.utils.response_helper import success_response, error_response

observations_bp = Blueprint("observations", __name__)

@observations_bp.route("", methods=["GET"])
def get_observations():
    sensor = request.args.get("sensor")
    min_frp = request.args.get("min_frp")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    limit = min(int(request.args.get("limit", 200)), 5000)

    query = "SELECT * FROM observations WHERE 1=1"
    params = []

    if sensor:
        query += " AND UPPER(sensor) = ?"
        params.append(sensor.upper())
    if min_frp:
        query += " AND frp >= ?"
        params.append(float(min_frp))
    if start_date:
        query += " AND acq_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND acq_date <= ?"
        params.append(end_date)

    query += " ORDER BY acq_date DESC LIMIT ?"
    params.append(limit)

    records = query_as_dicts(query, params)
    return success_response(records, count=len(records))

@observations_bp.route("/<obs_id>", methods=["GET"])
def get_observation_detail(obs_id):
    records = query_as_dicts("SELECT * FROM observations WHERE id = ?", [obs_id])
    if not records:
        return error_response("Observation not found", status_code=404)
    return success_response(records[0])

@observations_bp.route("/modis", methods=["GET"])
def get_modis_observations():
    limit = min(int(request.args.get("limit", 200)), 5000)
    records = query_as_dicts("SELECT * FROM observations WHERE sensor = 'MODIS' ORDER BY acq_date DESC LIMIT ?", [limit])
    return success_response(records, count=len(records))

@observations_bp.route("/viirs", methods=["GET"])
def get_viirs_observations():
    limit = min(int(request.args.get("limit", 200)), 5000)
    records = query_as_dicts("SELECT * FROM observations WHERE sensor = 'VIIRS' ORDER BY acq_date DESC LIMIT ?", [limit])
    return success_response(records, count=len(records))

@observations_bp.route("/map", methods=["GET"])
def get_map_observations():
    """Retrieve observations within map bounding box coordinates or by region, including harmonized FRP"""
    min_lat = request.args.get("min_lat", type=float)
    max_lat = request.args.get("max_lat", type=float)
    min_lon = request.args.get("min_lon", type=float)
    max_lon = request.args.get("max_lon", type=float)
    region = request.args.get("region")
    sensor = request.args.get("sensor")
    min_frp = request.args.get("min_frp", type=float)
    limit = min(int(request.args.get("limit", 2500)), 10000)

    query = """
        SELECT id, sensor, latitude, longitude, frp, harmonized_frp, harmonized,
               acq_date, confidence, brightness, region
        FROM observations
        WHERE 1=1
    """
    params = []

    if region and region.upper() not in ("ALL", "GLOBAL"):
        query += " AND UPPER(region) = ?"
        params.append(region.upper())
    elif None not in (min_lat, max_lat, min_lon, max_lon):
        query += " AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?"
        params.extend([min_lat, max_lat, min_lon, max_lon])

    if sensor and sensor.upper() != "ALL":
        query += " AND UPPER(sensor) = ?"
        params.append(sensor.upper())

    if min_frp is not None and min_frp > 0:
        query += " AND frp >= ?"
        params.append(min_frp)

    query += " ORDER BY frp DESC LIMIT ?"
    params.append(limit)

    records = query_as_dicts(query, params)
    return success_response(records, count=len(records))

@observations_bp.route("/statistics", methods=["GET"])
def get_statistics():
    stats = query_as_dicts("""
        SELECT 
            COUNT(*) as total_observations,
            COUNT(CASE WHEN sensor = 'MODIS' THEN 1 END) as modis_count,
            COUNT(CASE WHEN sensor = 'VIIRS' THEN 1 END) as viirs_count,
            AVG(frp) as avg_frp,
            MAX(frp) as max_frp,
            MIN(frp) as min_frp
        FROM observations;
    """)
    return success_response(stats[0] if stats else {})

@observations_bp.route("/by-region", methods=["GET"])
def get_by_region():
    res = query_as_dicts("""
        SELECT 
            COALESCE(region, 'Unknown') as region,
            COUNT(*) as count,
            AVG(frp) as avg_frp
        FROM observations
        GROUP BY 1
        ORDER BY count DESC;
    """)
    return success_response(res)

@observations_bp.route("/by-date", methods=["GET"])
def get_by_date():
    res = query_as_dicts("""
        SELECT 
            acq_date,
            COUNT(*) as count,
            AVG(frp) as avg_frp
        FROM observations
        WHERE acq_date IS NOT NULL
        GROUP BY acq_date
        ORDER BY acq_date ASC;
    """)
    return success_response(res)

@observations_bp.route("/by-sensor", methods=["GET"])
def get_by_sensor():
    res = query_as_dicts("""
        SELECT 
            sensor,
            COUNT(*) as count,
            AVG(frp) as avg_frp,
            MAX(frp) as max_frp
        FROM observations
        GROUP BY sensor;
    """)
    return success_response(res)

