from fastapi import APIRouter
from app.services.weather_service import get_weather
from app.database.connection import get_db
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["Weather"])


@router.get("/weather")
async def fetch_weather(city: str = None):
    """Get current weather + 5-day forecast."""
    db = get_db()
    weather = await get_weather(city)

    # Cache to DB
    doc = weather.model_dump()
    doc["timestamp"] = datetime.now(timezone.utc)
    await db.weather_data.insert_one(doc)

    return weather
