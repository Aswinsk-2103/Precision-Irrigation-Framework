from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SensorDataIn(BaseModel):
    soil_moisture: float = Field(..., ge=0, le=100, description="Soil moisture %")
    temperature: float = Field(..., ge=-10, le=60, description="Air temperature °C")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity %")
    rainfall: float = Field(0.0, ge=0, description="Rainfall mm")
    rain_probability: float = Field(0.0, ge=0, le=100, description="Rain probability %")
    wind_speed: float = Field(0.0, ge=0, description="Wind speed km/h")
    farm_id: Optional[str] = "default"
    source: Optional[str] = "simulator"  # "simulator" | "esp32" | "manual"


class SensorDataOut(SensorDataIn):
    id: Optional[str] = None
    timestamp: Optional[datetime] = None


class SensorStats(BaseModel):
    avg_moisture: float
    avg_temperature: float
    avg_humidity: float
    total_rainfall: float
    count: int
