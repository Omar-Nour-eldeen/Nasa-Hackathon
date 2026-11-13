from flask import Blueprint, request
from app.services.job_manager import job_manager
from app.utils.response_helper import success_response, error_response

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("", methods=["GET"])
def list_jobs():
    jobs = job_manager.get_all_jobs()
    return success_response(jobs)

@jobs_bp.route("/<job_id>", methods=["GET"])
def get_job(job_id):
    job = job_manager.get_job(job_id)
    if not job:
        return error_response("Job not found", status_code=404)
    return success_response(job)

@jobs_bp.route("/<job_id>/status", methods=["GET"])
def get_job_status(job_id):
    job = job_manager.get_job(job_id)
    if not job:
        return error_response("Job not found", status_code=404)
    return success_response({
        "job_id": job["id"],
        "status": job["status"],
        "progress": job["progress"]
    })

@jobs_bp.route("/<job_id>/logs", methods=["GET"])
def get_job_logs(job_id):
    job = job_manager.get_job(job_id)
    if not job:
        return error_response("Job not found", status_code=404)
    return success_response({
        "job_id": job["id"],
        "logs": job.get("logs", [])
    })

@jobs_bp.route("/<job_id>/cancel", methods=["POST"])
def cancel_job(job_id):
    success = job_manager.cancel_job(job_id)
    if not success:
        return error_response("Job cannot be cancelled or not found", status_code=400)
    return success_response({"job_id": job_id, "status": "cancelled"}, message="Job cancellation requested")

