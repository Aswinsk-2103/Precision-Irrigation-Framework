from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from app.database.connection import get_db

router = APIRouter(prefix="/api", tags=["Analytics"])


@router.get("/analytics")
async def get_analytics(farm_id: str = "default", days: int = 7):
    db = get_db()
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # ── Daily water consumption ─────────────────────────────────────
    pipeline_water = [
        {"$match": {"farm_id": farm_id, "timestamp": {"$gte": since}, "action": "off"}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "water_used": {"$sum": "$water_used"},
            "sessions": {"$sum": 1},
            "total_duration": {"$sum": "$duration_minutes"},
        }},
        {"$sort": {"_id": 1}},
    ]
    water_docs = await db.irrigation_history.aggregate(pipeline_water).to_list(length=days + 2)

    # ── Sensor moisture trend ───────────────────────────────────────
    pipeline_moisture = [
        {"$match": {"farm_id": farm_id, "timestamp": {"$gte": since}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d %H:00", "date": "$timestamp"}},
            "avg_moisture": {"$avg": "$soil_moisture"},
            "avg_temp": {"$avg": "$temperature"},
            "avg_humidity": {"$avg": "$humidity"},
        }},
        {"$sort": {"_id": 1}},
        {"$limit": 168},  # max 7 days × 24h
    ]
    moisture_docs = await db.sensor_data.aggregate(pipeline_moisture).to_list(length=168)

    # ── Prediction accuracy ─────────────────────────────────────────
    total_predictions = await db.predictions.count_documents({"farm_id": farm_id, "timestamp": {"$gte": since}})
    irrigation_predicted = await db.predictions.count_documents({
        "farm_id": farm_id,
        "timestamp": {"$gte": since},
        "irrigation_required": True,
    })

    # ── Summary metrics ─────────────────────────────────────────────
    total_water = sum(d["water_used"] for d in water_docs)
    total_sessions = sum(d["sessions"] for d in water_docs)
    avg_moisture = (
        sum(d["avg_moisture"] for d in moisture_docs) / len(moisture_docs)
        if moisture_docs else 0
    )

    return {
        "summary": {
            "total_water_used": round(total_water, 1),
            "total_sessions": total_sessions,
            "avg_soil_moisture": round(avg_moisture, 1),
            "total_predictions": total_predictions,
            "irrigation_recommended_count": irrigation_predicted,
            "days": days,
        },
        "daily_water": [
            {
                "date": d["_id"],
                "water_used": round(d["water_used"], 1),
                "sessions": d["sessions"],
                "duration": round(d["total_duration"], 1),
            }
            for d in water_docs
        ],
        "moisture_trend": [
            {
                "time": d["_id"],
                "soil_moisture": round(d["avg_moisture"], 1),
                "temperature": round(d["avg_temp"], 1),
                "humidity": round(d["avg_humidity"], 1),
            }
            for d in moisture_docs
        ],
    }
