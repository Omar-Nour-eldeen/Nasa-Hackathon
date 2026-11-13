import uuid
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from scipy.interpolate import interp1d
from app.storage.analytics_db import get_db_connection, query_as_dicts

class HarmonizationService:
    METHODS = [
        {"id": "ratio", "name": "Ratio Calibration", "description": "Multiplicative scaling factor based on mean/median ratio between MODIS and VIIRS FRP."},
        {"id": "linear_regression", "name": "Linear Regression", "description": "Ordinary Least Squares (OLS) regression mapping VIIRS observations to MODIS scale."},
        {"id": "quantile_mapping", "name": "Quantile Mapping", "description": "Non-parametric empirical distribution transfer mapping cumulative distribution functions."},
        {"id": "random_forest", "name": "Random Forest Regressor", "description": "Non-linear multi-feature machine learning model incorporating spatial context."}
    ]

    @classmethod
    def get_available_methods(cls):
        return cls.METHODS

    @staticmethod
    def calibrate_ratio(x_target: np.ndarray, y_ref: np.ndarray):
        """Ratio calibration: factor = mean(y_ref) / mean(x_target)"""
        if len(x_target) == 0 or len(y_ref) == 0:
            return {"ratio": 1.0, "metrics": {}}
        factor = float(np.nanmean(y_ref) / max(np.nanmean(x_target), 1e-6))
        predicted = x_target * factor
        mae = float(mean_absolute_error(y_ref, predicted))
        rmse = float(root_mean_squared_error(y_ref, predicted))
        bias = float(np.mean(predicted - y_ref))
        corr = float(np.corrcoef(predicted, y_ref)[0, 1]) if len(predicted) > 1 else 1.0
        return {
            "factor": factor,
            "metrics": {
                "mae": mae,
                "rmse": rmse,
                "bias": bias,
                "correlation": corr
            }
        }

    @staticmethod
    def calibrate_linear_regression(x_target: np.ndarray, y_ref: np.ndarray):
        """Linear Regression: y = slope * x + intercept"""
        X = x_target.reshape(-1, 1)
        model = LinearRegression()
        model.fit(X, y_ref)
        predicted = model.predict(X)
        mae = float(mean_absolute_error(y_ref, predicted))
        rmse = float(root_mean_squared_error(y_ref, predicted))
        bias = float(np.mean(predicted - y_ref))
        corr = float(np.corrcoef(predicted, y_ref)[0, 1]) if len(predicted) > 1 else 1.0
        return {
            "slope": float(model.coef_[0]),
            "intercept": float(model.intercept_),
            "metrics": {
                "mae": mae,
                "rmse": rmse,
                "bias": bias,
                "correlation": corr
            }
        }

    @staticmethod
    def calibrate_quantile_mapping(x_target: np.ndarray, y_ref: np.ndarray, quantiles_count=100):
        """Quantile mapping transfer function"""
        qs = np.linspace(0, 1, quantiles_count)
        q_target = np.quantile(x_target, qs)
        q_ref = np.quantile(y_ref, qs)
        f = interp1d(q_target, q_ref, bounds_error=False, fill_value="extrapolate")
        predicted = f(x_target)
        mae = float(mean_absolute_error(y_ref, predicted))
        rmse = float(root_mean_squared_error(y_ref, predicted))
        bias = float(np.mean(predicted - y_ref))
        corr = float(np.corrcoef(predicted, y_ref)[0, 1]) if len(predicted) > 1 else 1.0
        return {
            "quantiles_count": quantiles_count,
            "metrics": {
                "mae": mae,
                "rmse": rmse,
                "bias": bias,
                "correlation": corr
            }
        }

    @staticmethod
    def calibrate_random_forest(X_features: np.ndarray, y_ref: np.ndarray):
        """Random Forest regression calibration"""
        rf = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
        rf.fit(X_features, y_ref)
        predicted = rf.predict(X_features)
        mae = float(mean_absolute_error(y_ref, predicted))
        rmse = float(root_mean_squared_error(y_ref, predicted))
        bias = float(np.mean(predicted - y_ref))
        corr = float(np.corrcoef(predicted, y_ref)[0, 1]) if len(predicted) > 1 else 1.0
        return {
            "estimators": 50,
            "feature_importances": [float(val) for val in rf.feature_importances_],
            "metrics": {
                "mae": mae,
                "rmse": rmse,
                "bias": bias,
                "correlation": corr
            }
        }

    @staticmethod
    def apply_harmonization_to_db(method: str, x_target: np.ndarray, y_ref: np.ndarray):
        """
        Trains the chosen calibration model and updates the observations table:
        - MODIS (Reference sensor): harmonized = TRUE, harmonized_frp = frp
        - VIIRS (Target sensor): harmonized = TRUE, harmonized_frp = model.predict(frp)
        """
        con = get_db_connection()
        try:
            # 1. Update MODIS as the baseline reference
            con.execute("""
                UPDATE observations
                SET harmonized = TRUE,
                    harmonized_frp = frp
                WHERE sensor = 'MODIS';
            """)

            # 2. Train model and predict for VIIRS
            viirs_df = con.execute("""
                SELECT id, frp FROM observations
                WHERE sensor = 'VIIRS' AND frp IS NOT NULL;
            """).df()

            if viirs_df.empty:
                return

            v_frp = viirs_df["frp"].to_numpy()

            if method == "ratio":
                factor = float(np.nanmean(y_ref) / max(np.nanmean(x_target), 1e-6))
                pred_frp = v_frp * factor
            elif method == "random_forest":
                X_train = np.column_stack([x_target, np.log1p(np.maximum(0, x_target))])
                rf = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
                rf.fit(X_train, y_ref)
                X_viirs = np.column_stack([v_frp, np.log1p(np.maximum(0, v_frp))])
                pred_frp = rf.predict(X_viirs)
            elif method == "quantile_mapping":
                qs = np.linspace(0, 1, 100)
                q_target = np.quantile(x_target, qs)
                q_ref = np.quantile(y_ref, qs)
                f = interp1d(q_target, q_ref, bounds_error=False, fill_value="extrapolate")
                pred_frp = f(v_frp)
            else:  # linear_regression
                X_train = x_target.reshape(-1, 1)
                lr = LinearRegression()
                lr.fit(X_train, y_ref)
                pred_frp = lr.predict(v_frp.reshape(-1, 1))

            viirs_df["pred_frp"] = np.round(np.maximum(0.0, pred_frp), 2)

            # 3. Update DuckDB with harmonized predictions
            con.register("viirs_updates", viirs_df[["id", "pred_frp"]])
            con.execute("""
                UPDATE observations
                SET harmonized = TRUE,
                    harmonized_frp = viirs_updates.pred_frp
                FROM viirs_updates
                WHERE observations.id = viirs_updates.id;
            """)
        finally:
            con.close()

    @staticmethod
    def calculate_activity_index():
        """
        Calculates the Harmonized Activity Index (HAI) combining
        hotspot counts, density, and calibrated FRP
        """
        con = get_db_connection()
        try:
            query = """
                SELECT 
                    acq_date,
                    COUNT(*) AS total_hotspots,
                    COALESCE(AVG(harmonized_frp), AVG(frp), 0) AS mean_frp,
                    COALESCE(SUM(harmonized_frp), SUM(frp), 0) AS total_energy,
                    (COUNT(*) * 0.4 + COALESCE(SUM(harmonized_frp), SUM(frp), 0) * 0.6) AS harmonized_activity_index
                FROM observations
                WHERE acq_date IS NOT NULL
                GROUP BY acq_date
                ORDER BY acq_date ASC;
            """
            return con.execute(query).df().to_dict(orient="records")
        finally:
            con.close()
