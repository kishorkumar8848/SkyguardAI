import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.app.core.config import settings
from backend.app.models.db_models import Base, DBStation

# Ensure data directory exists
os.makedirs("./data", exist_ok=True)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default stations if not present
    async with AsyncSessionLocal() as session:
        for station_id, cfg in settings.DEFAULT_STATIONS.items():
            existing = await session.get(DBStation, station_id)
            if not existing:
                station_db = DBStation(
                    station_id=cfg.station_id,
                    station_name=cfg.station_name,
                    latitude=cfg.latitude,
                    longitude=cfg.longitude,
                    elevation=cfg.elevation,
                    climate_zone=cfg.climate_zone,
                    status="HEALTHY",
                    config_json=cfg.model_dump()
                )
                session.add(station_db)
        await session.commit()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
