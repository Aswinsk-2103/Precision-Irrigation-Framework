from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IrrigationControl(BaseModel):
    action: str          # "on" | "off"
    farm_id: Optional[str] = "default"
    triggered_by: Optional[str] = "manual"  # "manual" | "auto" | "ml"
    notes: Optional[str] = None


class IrrigationStatus(BaseModel):
    is_active: bool
    started_at: Optional[datetime] = None
    water_used_today: float = 0.0
    water_saved_today: float = 0.0
    total_duration_today: float = 0.0
    farm_id: Optional[str] = "default"


class IrrigationHistoryItem(BaseModel):
    id: Optional[str] = None
    timestamp: Optional[datetime] = None
    action: str
    duration_minutes: float = 0.0
    water_used: float = 0.0
    ml_recommended: Optional[bool] = None
    risk_level: Optional[str] = None
    triggered_by: str = "manual"
    farm_id: Optional[str] = "default"
    notes: Optional[str] = None
