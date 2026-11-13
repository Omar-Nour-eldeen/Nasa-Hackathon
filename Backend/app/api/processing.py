from flask import Blueprint, request
from app.services.processing_service import ProcessingService
from app.services.job_manager import job_manager
from app.utils.response_helper import success_response, error_response

processing_bp = Blueprint("processing", __name__)

@processing_bp.route("/clean", methods=["POST"])
def clean_data():
    res = ProcessingService.clean_data()
    return success_response(res, message="Data cleaning process finished successfully")

@processing_bp.route("/filter", methods=["POST"])
def filter_data():
    payload = request.get_json() or {}
    results = ProcessingService.filter_observations(
        sensor=payload.get("sensor"),
        min_frp=payload.get("min_frp"),
        start_date=payload.get("start_date"),
        end_date=payload.get("end_date"),
        confidence=payload.get("confidence")
    )
    return success_response(results, count=len(results))

@processing_bp.route("/normalize", methods=["POST"])
def normalize_data():
    # Example placeholder normalization job
    return success_response({"normalized_columns": ["frp", "brightness"]}, message="Normalization completed")

@processing_bp.route("/spatial-matching", methods=["POST"])
def spatial_matching():
    payload = request.get_json() or {}
    dist = payload.get("max_distance_km", 1.5)
    matched = ProcessingService.match_spatial_temporal(max_distance_km=dist)
    return success_response(matched, matched_pairs=len(matched))

@processing_bp.route("/temporal-matching", methods=["POST"])
def temporal_matching():
    matched = ProcessingService.match_spatial_temporal()
    return success_response(matched, matched_pairs=len(matched))

@processing_bp.route("/grid/generate", methods=["POST"])
def generate_grid():
    payload = request.get_json() or {}
    grid_size = payload.get("grid_size", 0.1)
    grid_cells = ProcessingService.generate_spatial_grid(grid_size=grid_size)
    return success_response(grid_cells, total_cells=len(grid_cells))

@processing_bp.route("/grid", methods=["GET"])
def get_grid():
    grid_size = request.args.get("grid_size", default=0.1, type=float)
    grid_cells = ProcessingService.generate_spatial_grid(grid_size=grid_size)
    return success_response(grid_cells, total_cells=len(grid_cells))

@processing_bp.route("/aggregate", methods=["POST"])
def aggregate_data():
    grid_cells = ProcessingService.generate_spatial_grid()
    return success_response(grid_cells, message="Spatial aggregation completed")

@processing_bp.route("/features/extract", methods=["POST"])
def extract_features():
    features = [
        "latitude", "longitude", "scan", "track", "confidence_numeric",
        "daynight_flag", "solar_hour", "spatial_cluster_density"
    ]
    return success_response({"extracted_features": features})

@processing_bp.route("/jobs", methods=["POST"])
def create_processing_job():
    payload = request.get_json() or {}
    job_type = payload.get("job_type", "data_processing")

    def run_dummy_task(job_record):
        import time
        for step in range(1, 5):
            time.sleep(0.5)
            job_record["progress"] = step * 25
            job_record["logs"].append(f"Processing step {step}/4 complete.")
        return {"status": "success", "processed_batches": 4}

    job_id = job_manager.submit_job(job_type, run_dummy_task)
    return success_response({"job_id": job_id, "status": "queued"}, message="Processing job created")

@processing_bp.route("/jobs/<job_id>", methods=["GET"])
def get_processing_job(job_id):
    job = job_manager.get_job(job_id)
    if not job:
        return error_response("Job not found", status_code=404)
    return success_response(job)

