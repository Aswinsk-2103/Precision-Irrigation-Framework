from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.models.prediction import PredictionRequest, PredictionResponse
from app.database.connection import get_db
import sys, os

# Add ml-engine to Python path
ML_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml-engine"))
if ML_PATH not in sys.path:
    sys.path.insert(0, ML_PATH)

router = APIRouter(prefix="/api", tags=["ML Prediction"])


def _get_predictor():
    try:
        from predict import predictor
        predictor.load()
        return predictor
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"ML model not loaded: {e}. Run train.py first.")


def _build_recommendation_text(result: dict, inp: dict) -> str:
    sm = inp.get("soil_moisture", 0)
    rain_p = inp.get("rain_probability", 0)
    crop = inp.get("crop_type", "crop")
    if result["irrigation_required"]:
        return (
            f"Irrigation Required — {crop} needs approximately "
            f"{result['water_quantity']} litres over {result['duration_minutes']} minutes. "
            f"Risk level: {result['risk_level']}."
        )
    elif rain_p > 70:
        return f"Do not irrigate — rainfall is expected ({rain_p:.0f}% probability)."
    else:
        return f"No irrigation needed — soil moisture ({sm:.1f}%) is adequate."


@router.post("/predict", response_model=PredictionResponse)
async def predict_irrigation(request: PredictionRequest):
    """Run ML prediction and store result in database."""
    db = get_db()
    predictor = _get_predictor()

    inp = request.model_dump()
    result = predictor.predict(inp)
    result["recommendation_text"] = _build_recommendation_text(result, inp)
    result["timestamp"] = datetime.now(timezone.utc)

    # Persist prediction
    doc = {**inp, **result}
    await db.predictions.insert_one(doc)

    return PredictionResponse(**result)


@router.get("/predictions/history")
async def get_prediction_history(limit: int = 20, farm_id: str = "default"):
    """Retrieve recent predictions."""
    db = get_db()
    cursor = db.predictions.find(
        {"farm_id": farm_id},
        sort=[("timestamp", -1)],
        limit=limit
    )
    docs = await cursor.to_list(length=limit)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs
