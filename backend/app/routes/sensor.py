from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.models.sensor import SensorDataIn
from app.database.connection import get_db
from bson import ObjectId

router = APIRouter(prefix="/api", tags=["Sensors"])


def _serialize(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/sensor-data")
async def post_sensor_data(data: SensorDataIn):
    """Ingest sensor data from simulator, ESP32, or manual input."""
    db = get_db()
    doc = data.model_dump()
    doc["timestamp"] = datetime.now(timezone.utc)
    result = await db.sensor_data.insert_one(doc)
    return {"id": str(result.inserted_id), "status": "ok", "timestamp": doc["timestamp"]}


@router.get("/sensor-data")
async def get_sensor_data(limit: int = 50, farm_id: str = "default"):
    """Get recent sensor readings."""
    db = get_db()
    cursor = db.sensor_data.find(
        {"farm_id": farm_id},
        sort=[("timestamp", -1)],
        limit=limit
    )
    docs = await cursor.to_list(length=limit)
    return [_serialize(d) for d in docs]


@router.get("/sensor-data/latest")
async def get_latest_sensor(farm_id: str = "default"):
    """Get the most recent sensor reading."""
    db = get_db()
    doc = await db.sensor_data.find_one(
        {"farm_id": farm_id},
        sort=[("timestamp", -1)]
    )
    if not doc:
        # Return mock data if no sensor data yet
        return {
            "soil_moisture": 42.5,
            "temperature": 28.3,
            "humidity": 65.0,
            "rainfall": 0.0,
            "rain_probability": 15.0,
            "wind_speed": 8.2,
            "farm_id": farm_id,
            "source": "mock",
            "timestamp": datetime.now(timezone.utc),
        }
    return _serialize(doc)
