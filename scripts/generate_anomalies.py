import os
import sys
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.simulation.generator import AWSDataGenerator
from backend.app.simulation.injector import AnomalyInjector

def main():
    print("Generating comprehensive synthetic AWS anomaly test dataset...")
    os.makedirs("./data/synthetic", exist_ok=True)
    
    gen = AWSDataGenerator(random_seed=123)
    injector = AnomalyInjector(random_seed=123)

    stations = ["AWS-DEL-001", "AWS-JOD-002", "AWS-MUM-003", "AWS-CHN-004", "AWS-SHM-005"]
    all_records = []

    for s_id in stations:
        base_series = gen.generate_series(s_id, datetime(2026, 6, 1, 0, 0), num_steps=288, step_minutes=5)
        
        # Inject specific scenario per station
        if s_id == "AWS-DEL-001":
            # Temperature spike
            base_series = injector.inject(base_series, "SPIKE", parameter="temperature", start_idx=40, duration=3, severity=1.3)
        elif s_id == "AWS-JOD-002":
            # Genuine heatwave
            base_series = injector.inject(base_series, "HEATWAVE", parameter="temperature", start_idx=70, duration=24, severity=1.2)
        elif s_id == "AWS-MUM-003":
            # Frozen temperature sensor
            base_series = injector.inject(base_series, "FROZEN", parameter="temperature", start_idx=100, duration=16)
        elif s_id == "AWS-CHN-004":
            # Progressive calibration drift
            base_series = injector.inject(base_series, "DRIFT", parameter="temperature", start_idx=120, duration=36, severity=1.1)
        elif s_id == "AWS-SHM-005":
            # Communication gap
            base_series = injector.inject(base_series, "COMMUNICATION_GAP", start_idx=180, duration=1)

        for obs in base_series:
            all_records.append(obs.model_dump())

    df = pd.DataFrame(all_records)
    csv_path = "./data/synthetic/aws_synthetic_anomalies.csv"
    df.to_csv(csv_path, index=False)
    print(f"[SUCCESS] Exported {len(df)} records across {len(stations)} stations to {csv_path}")

if __name__ == "__main__":
    main()
