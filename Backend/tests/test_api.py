from app import create_app

def run_tests():
    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    print("1. Testing Health Check...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    health_data = res.get_json()
    assert health_data["status"] == "healthy"
    print("   ✅ Health Check passed:", health_data["status"])

    print("2. Testing Observations Endpoint...")
    res = client.get("/api/observations?limit=5")
    assert res.status_code == 200
    obs_data = res.get_json()
    assert obs_data["status"] == "success"
    assert len(obs_data["data"]) > 0
    print(f"   ✅ Observations passed: retrieved {len(obs_data['data'])} records")

    print("3. Testing Harmonization Methods...")
    res = client.get("/api/harmonization/methods")
    assert res.status_code == 200
    methods_data = res.get_json()
    assert len(methods_data["data"]) == 4
    print(f"   ✅ Harmonization Methods passed: {len(methods_data['data'])} methods available")

    print("4. Testing Harmonization Run (Linear Regression)...")
    res = client.post("/api/harmonization/run", json={"method": "linear_regression"})
    assert res.status_code == 200
    run_data = res.get_json()
    print("   ✅ Harmonization Run passed, run_id:", run_data["data"]["run_id"])

    print("5. Testing Anomaly Detection...")
    res = client.post("/api/anomalies/detect", json={"threshold_zscore": 2.0})
    assert res.status_code == 200
    anomaly_data = res.get_json()
    print(f"   ✅ Anomaly Detection passed: detected {anomaly_data['data']['detected']} anomalies")

    print("6. Testing Dashboard Overview...")
    res = client.get("/api/dashboard/overview")
    assert res.status_code == 200
    dash_data = res.get_json()
    print("   ✅ Dashboard Overview passed:", dash_data["data"]["observations"]["total_observations"], "total observations")

    print("7. Testing Analytics Hotspot Trends...")
    res = client.get("/api/analytics/hotspot-trends")
    assert res.status_code == 200
    trends_data = res.get_json()
    print(f"   ✅ Analytics Trends passed: {len(trends_data['data'])} trend points")

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The Backend is fully ready.")

if __name__ == "__main__":
    run_tests()
