from flask import Blueprint, request
from app.services.validation_service import ValidationService
from app.utils.response_helper import success_response

validation_bp = Blueprint("validation", __name__)

@validation_bp.route("/run", methods=["POST"])
def run_validation():
    metrics = ValidationService.get_validation_metrics()
    return success_response(metrics, message="Validation run completed")

@validation_bp.route("/results", methods=["GET"])
def get_results():
    metrics = ValidationService.get_validation_metrics()
    return success_response(metrics)

@validation_bp.route("/metrics/mae", methods=["GET"])
def get_mae():
    metrics = ValidationService.get_validation_metrics()
    return success_response({"mae": metrics["mae"]})

@validation_bp.route("/metrics/rmse", methods=["GET"])
def get_rmse():
    metrics = ValidationService.get_validation_metrics()
    return success_response({"rmse": metrics["rmse"]})

@validation_bp.route("/metrics/bias", methods=["GET"])
def get_bias():
    metrics = ValidationService.get_validation_metrics()
    return success_response({"bias": metrics["bias"]})

@validation_bp.route("/metrics/correlation", methods=["GET"])
def get_correlation():
    metrics = ValidationService.get_validation_metrics()
    return success_response({"correlation": metrics["correlation"]})

@validation_bp.route("/distribution", methods=["GET"])
def get_distribution():
    dist = ValidationService.get_distribution_comparison()
    return success_response(dist)

@validation_bp.route("/temporal", methods=["GET"])
def get_temporal():
    temp = ValidationService.get_temporal_validation()
    return success_response(temp)

@validation_bp.route("/spatial", methods=["GET"])
def get_spatial():
    spat = ValidationService.get_spatial_validation()
    return success_response(spat)

