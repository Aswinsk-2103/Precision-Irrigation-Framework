from pydantic import BaseModel
from typing import Optional, List, Dict


class GrowthStage(BaseModel):
    name: str
    min_moisture: float
    max_moisture: float
    water_requirement: float   # litres per session


class Crop(BaseModel):
    id: Optional[str] = None
    name: str
    optimal_moisture_min: float
    optimal_moisture_max: float
    min_moisture_threshold: float
    max_moisture_threshold: float
    typical_water_requirement: float
    growth_stages: List[GrowthStage] = []
    description: Optional[str] = None
    icon: Optional[str] = None
    is_custom: bool = False


class CropUpdate(BaseModel):
    optimal_moisture_min: Optional[float] = None
    optimal_moisture_max: Optional[float] = None
    min_moisture_threshold: Optional[float] = None
    typical_water_requirement: Optional[float] = None
