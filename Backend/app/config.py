import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    PORT = int(os.environ.get("PORT", 5000))
    HOST = os.environ.get("HOST", "0.0.0.0")

    # Data directories
    DATA_DIR = BASE_DIR / "data"
    RAW_DATA_DIR = DATA_DIR / "raw"
    PROCESSED_DATA_DIR = DATA_DIR / "processed"
    EXPORTS_DIR = DATA_DIR / "exports"
    ANALYTICS_DB_PATH = str(DATA_DIR / "analytics.duckdb")

    # Max upload size (e.g. 100MB for satellite datasets)
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024

    @classmethod
    def ensure_directories(cls):
        """Ensure storage directories exist"""
        for folder in [cls.RAW_DATA_DIR, cls.PROCESSED_DATA_DIR, cls.EXPORTS_DIR]:
            folder.mkdir(parents=True, exist_ok=True)

