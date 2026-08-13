from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class WeatherCurrent(BaseModel):
    temperature: float
    feels_like: float
    humidity: float
    wind_speed: float
    rainfall: float = 0.0
    rain_probability: float = 0.0
    condition: str
    description: str
    icon: Optional[str] = None
    city: Optional[str] = None
    timestamp: Optional[datetime] = None


class WeatherForecastItem(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    humidity: float
    rain_probability: float
    rainfall: float = 0.0
    condition: str
    icon: Optional[str] = None


class WeatherResponse(BaseModel):
    current: WeatherCurrent
    forecast: List[WeatherForecastItem] = []
    source: str = "api"   # "api" | "mock"
