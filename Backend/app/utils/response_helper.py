from flask import jsonify

def success_response(data=None, message="Operation successful", status_code=200, **kwargs):
    """Standardized JSON success response"""
    payload = {
        "status": "success",
        "message": message,
        "data": data if data is not None else {}
    }
    if kwargs:
        payload.update(kwargs)
    return jsonify(payload), status_code

def error_response(message="An error occurred", status_code=400, errors=None):
    """Standardized JSON error response"""
    payload = {
        "status": "error",
        "message": message
    }
    if errors is not None:
        payload["errors"] = errors
    return jsonify(payload), status_code

