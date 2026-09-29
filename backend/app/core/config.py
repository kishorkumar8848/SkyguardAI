import os
from typing import Dict
from backend.app.models.schemas import StationConfig

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "SkyGuard AI")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/skyguard.db")
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    MODEL_DIR: str = os.getenv("MODEL_DIR", "./models/saved")
    SIMULATION_TICK_SECONDS: float = float(os.getenv("SIMULATION_TICK_SECONDS", "1.0"))
    SIMULATED_STEP_MINUTES: int = int(os.getenv("SIMULATED_STEP_MINUTES", "5"))

    # Configurable per-station meteorological standards (IMD / WMO norms)
    DEFAULT_STATIONS: Dict[str, StationConfig] = {
        "AWS-DEL-001": StationConfig(
            station_id="AWS-DEL-001",
            station_name="Delhi Safdarjung AWS",
            latitude=28.584,
            longitude=77.206,
            elevation=216.0,
            climate_zone="Semi-Arid Continental",
            temp_min=-2.0,
            temp_max=49.5,
            temp_rate_max=3.5,
            pressure_min=970.0,
            pressure_max=1030.0,
            pressure_rate_max=3.5,
            humidity_min=5.0,
            humidity_max=100.0,
            humidity_rate_max=30.0
        ),
        "AWS-JOD-002": StationConfig(
            station_id="AWS-JOD-002",
            station_name="Jodhpur Desert AWS",
            latitude=26.258,
            longitude=73.048,
            elevation=224.0,
            climate_zone="Hot Arid Thar Desert",
            temp_min=0.0,
            temp_max=52.0,
            temp_rate_max=4.0,
            pressure_min=965.0,
            pressure_max=1025.0,
            pressure_rate_max=3.5,
            humidity_min=2.0,
            humidity_max=100.0,
            humidity_rate_max=25.0
        ),
        "AWS-MUM-003": StationConfig(
            station_id="AWS-MUM-003",
            station_name="Mumbai Santacruz AWS",
            latitude=19.117,
            longitude=72.861,
            elevation=14.0,
            climate_zone="Coastal Tropical Wet-and-Dry",
            temp_min=12.0,
            temp_max=42.0,
            temp_rate_max=3.0,
            pressure_min=990.0,
            pressure_max=1022.0,
            pressure_rate_max=3.0,
            humidity_min=20.0,
            humidity_max=100.0,
            humidity_rate_max=25.0
        ),
        "AWS-CHN-004": StationConfig(
            station_id="AWS-CHN-004",
            station_name="Chennai Meenambakkam AWS",
            latitude=12.994,
            longitude=80.180,
            elevation=16.0,
            climate_zone="Coastal Maritime Tropical",
            temp_min=16.0,
            temp_max=44.0,
            temp_rate_max=3.0,
            pressure_min=990.0,
            pressure_max=1022.0,
            pressure_rate_max=3.0,
            humidity_min=25.0,
            humidity_max=100.0,
            humidity_rate_max=25.0
        ),
        "AWS-SHM-005": StationConfig(
            station_id="AWS-SHM-005",
            station_name="Shimla Ridge AWS",
            latitude=31.104,
            longitude=77.173,
            elevation=2205.0,
            climate_zone="Highland Montane Subtropical",
            temp_min=-12.0,
            temp_max=34.0,
            temp_rate_max=3.5,
            pressure_min=750.0,
            pressure_max=820.0,
            pressure_rate_max=4.0,
            humidity_min=10.0,
            humidity_max=100.0,
            humidity_rate_max=30.0
        ),
        "AWS-KOL-006": StationConfig(
            station_id="AWS-KOL-006",
            station_name="Kolkata Alipore AWS",
            latitude=22.525,
            longitude=88.324,
            elevation=6.0,
            climate_zone="Gangetic Delta Humid Subtropical",
            temp_min=8.0,
            temp_max=43.0,
            temp_rate_max=3.0,
            pressure_min=992.0,
            pressure_max=1024.0,
            pressure_rate_max=3.0,
            humidity_min=20.0,
            humidity_max=100.0,
            humidity_rate_max=30.0
        )
    }

settings = Settings()
