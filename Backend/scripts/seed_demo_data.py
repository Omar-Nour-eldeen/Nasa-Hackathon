"""
Seed script to populate sample MODIS and VIIRS satellite active fire observations
into the local DuckDB analytics database for immediate testing and frontend integration.
"""
import random
from datetime import datetime, timedelta
import pandas as pd
from app.services.ingestion_service import IngestionService

def generate_sample_data(count=300):
    records = []
    base_date = datetime.now() - timedelta(days=15)
    
    # Bounding box around a fire-prone region (e.g. California / Mediterranean / Amazon)
    for i in range(count):
        date_offset = random.randint(0, 14)
        acq_date = (base_date + timedelta(days=date_offset)).strftime("%Y-%m-%d")
        
        # Center coords around lat 36.5, lon -119.5 with variance
        lat = 36.5 + random.uniform(-2.5, 2.5)
        lon = -119.5 + random.uniform(-3.0, 3.0)
        
        # MODIS tends to have coarser resolution and higher threshold FRP
        modis_frp = max(5.0, random.gauss(25.0, 15.0))
        records.append({
            "sensor": "MODIS",
            "latitude": lat,
            "longitude": lon,
            "brightness": random.uniform(300.0, 380.0),
            "frp": round(modis_frp, 2),
            "acq_date": acq_date,
            "confidence": random.choice(["nominal", "high", "nominal"])
        })

        # VIIRS coincident observation (slightly perturbed coordinate & 375m higher resolution)
        viirs_frp = modis_frp * random.uniform(1.1, 1.4) + random.uniform(-2, 3)
        records.append({
            "sensor": "VIIRS",
            "latitude": lat + random.uniform(-0.005, 0.005),
            "longitude": lon + random.uniform(-0.005, 0.005),
            "brightness": random.uniform(310.0, 395.0),
            "frp": round(max(2.0, viirs_frp), 2),
            "acq_date": acq_date,
            "confidence": random.choice(["nominal", "high"])
        })
        
    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    from app.storage.analytics_db import init_analytics_db
    print("Initializing DuckDB schema...")
    init_analytics_db()

    print("Generating sample MODIS & VIIRS active fire observations...")
    df = generate_sample_data(200)
    
    modis_df = df[df["sensor"] == "MODIS"].copy()
    viirs_df = df[df["sensor"] == "VIIRS"].copy()
    
    m_count = IngestionService.ingest_dataframe(modis_df, "MODIS")
    v_count = IngestionService.ingest_dataframe(viirs_df, "VIIRS")
    
    print(f"✅ Ingested {m_count} MODIS and {v_count} VIIRS records into DuckDB analytics database!")

