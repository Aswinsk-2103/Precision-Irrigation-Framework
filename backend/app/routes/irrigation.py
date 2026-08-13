from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from app.models.irrigation import IrrigationControl, IrrigationStatus, IrrigationHistoryItem
from app.database.connection import get_db

router = APIRouter(prefix="/api", tags=["Irrigation"])

# In-memory irrigation state (replace with Redis in production)
_state = {
    "is_active": False,
    "started_at": None,
    "farm_id": "default",
}


@router.get("/irrigation-status", response_model=IrrigationStatus)
async def get_irrigation_status(farm_id: str = "default"):
    db = get_db()
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    cursor = db.irrigation_history.find({
        "farm_id": farm_id,
        "timestamp": {"$gte": today},
        "action": "off"
    })
    records = await cursor.to_list(length=200)

    water_used = sum(r.get("water_used", 0) for r in records)
    duration   = sum(r.get("duration_minutes", 0) for r in records)

    # Estimate saved: assume avg 25L per session if irrigation not done when ML says irrigate
    cursor2 = db.irrigation_history.find({
        "farm_id": farm_id,
        "timestamp": {"$gte": today},
        "action": "on",
        "ml_recommended": False
    })
    skipped = await cursor2.to_list(length=200)
    water_saved = len(skipped) * 18.0

    return IrrigationStatus(
        is_active=_state["is_active"],
        started_at=_state.get("started_at"),
        water_used_today=round(water_used, 1),
        water_saved_today=round(water_saved, 1),
        total_duration_today=round(duration, 1),
        farm_id=farm_id,
    )


@router.post("/irrigation/control")
async def control_irrigation(cmd: IrrigationControl):
    db = get_db()
    now = datetime.now(timezone.utc)

    if cmd.action == "on":
        _state["is_active"] = True
        _state["started_at"] = now
        _state["farm_id"] = cmd.farm_id or "default"

        doc = {
            "action": "on",
            "timestamp": now,
            "farm_id": cmd.farm_id or "default",
            "triggered_by": cmd.triggered_by or "manual",
            "notes": cmd.notes,
            "duration_minutes": 0,
            "water_used": 0,
        }
        result = await db.irrigation_history.insert_one(doc)
        return {"status": "Irrigation ON", "id": str(result.inserted_id), "started_at": now}

    elif cmd.action == "off":
        started = _state.get("started_at") or now
        duration = (now - started).total_seconds() / 60
        # Estimate ~1.5 L/min flow rate
        water_used = round(duration * 1.5, 1)

        _state["is_active"] = False
        _state["started_at"] = None

        doc = {
            "action": "off",
            "timestamp": now,
            "farm_id": cmd.farm_id or "default",
            "triggered_by": cmd.triggered_by or "manual",
            "notes": cmd.notes,
            "duration_minutes": round(duration, 1),
            "water_used": water_used,
        }
        result = await db.irrigation_history.insert_one(doc)
        return {"status": "Irrigation OFF", "duration_minutes": round(duration, 1), "water_used": water_used}

    return {"error": "Invalid action. Use 'on' or 'off'."}


@router.get("/irrigation-history")
async def get_irrigation_history(limit: int = 50, farm_id: str = "default"):
    db = get_db()
    cursor = db.irrigation_history.find(
        {"farm_id": farm_id},
        sort=[("timestamp", -1)],
        limit=limit
    )
    docs = await cursor.to_list(length=limit)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs
