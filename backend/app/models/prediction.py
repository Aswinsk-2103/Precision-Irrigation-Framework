from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class PredictionRequest(BaseModel):
    soil_moisture: float
    temperature: float
    humidity: float
    rainfall: float = 0.0
    rain_probability: float = 0.0
    wind_speed: float = 0.0
    soil_type: str = "Loamy"
    crop_type: str = "Wheat"
    growth_stage: str = "Vegetative"
    prev_irrigation: float = 0.0
    hours_since_irrigation: float = 24.0
    farm_id: Optional[str] = "default"


class PredictionResponse(BaseModel):
    irrigation_required: bool
    water_quantity: float          # litres
    duration_minutes: float        # minutes
    risk_level: str                # Low / Medium / High
    confidence: float              # 0–100
    feature_importance: Dict[str, float]
    reasons: List[str]
    timestamp: Optional[datetime] = None
    recommendation_text: Optional[str] = None
