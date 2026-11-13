from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.storage.analytics_db import init_analytics_db
from app.utils.response_helper import error_response

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all routes (allows Frontend dashboards on localhost:3000, 5173, etc.)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Initialize analytics database & directories
    Config.ensure_directories()
    init_analytics_db()

    # Register Blueprints
    from app.api.ingestion import ingestion_bp
    from app.api.observations import observations_bp
    from app.api.processing import processing_bp
    from app.api.harmonization import harmonization_bp
    from app.api.validation import validation_bp
    from app.api.anomalies import anomalies_bp
    from app.api.analytics import analytics_bp
    from app.api.dashboard import dashboard_bp
    from app.api.exports import exports_bp
    from app.api.jobs import jobs_bp

    app.register_blueprint(ingestion_bp, url_prefix="/api/ingestion")
    app.register_blueprint(observations_bp, url_prefix="/api/observations")
    app.register_blueprint(processing_bp, url_prefix="/api/processing")
    app.register_blueprint(harmonization_bp, url_prefix="/api/harmonization")
    app.register_blueprint(validation_bp, url_prefix="/api/validation")
    app.register_blueprint(anomalies_bp, url_prefix="/api/anomalies")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(exports_bp, url_prefix="/api/exports")
    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")

    # Root & Health check routes
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "service": "PyroScope Backend API",
            "status": "online",
            "docs": "/api/health"
        })

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "database": "DuckDB Analytics Engine Ready",
            "endpoints": [
                "/api/ingestion",
                "/api/observations",
                "/api/processing",
                "/api/harmonization",
                "/api/validation",
                "/api/anomalies",
                "/api/analytics",
                "/api/dashboard",
                "/api/exports",
                "/api/jobs"
            ]
        })

    # JSON Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return error_response("Endpoint or resource not found", status_code=404)

    @app.errorhandler(500)
    def internal_error(e):
        return error_response(f"Internal server error: {str(e)}", status_code=500)

    return app

