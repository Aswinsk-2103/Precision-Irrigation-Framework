"""
OpenWeatherMap weather service with realistic mock fallback.
"""
import os
import httpx
from datetime import datetime, timezone
from app.models.weather import WeatherResponse, WeatherCurrent, WeatherForecastItem
from dotenv import load_dotenv
import random

load_dotenv()

API_KEY  = os.getenv("WEATHER_API_KEY", "")
CITY     = os.getenv("WEATHER_CITY", "Mumbai")
COUNTRY  = os.getenv("WEATHER_COUNTRY", "IN")
BASE_URL = "https://api.openweathermap.org/data/2.5"

CONDITIONS = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Thunderstorm", "Drizzle", "Sunny"]


def _mock_weather() -> WeatherResponse:
    """Return realistic simulated weather data when API key not configured."""
    temp = round(random.uniform(24, 36), 1)
    humidity = round(random.uniform(45, 80), 1)
    rain_prob = round(random.uniform(5, 75), 1)
    wind = round(random.uniform(5, 25), 1)
    rainfall = round(random.uniform(0, 8), 1) if rain_prob > 50 else 0.0
    condition = random.choice(CONDITIONS)

    forecast = []
    for i in range(1, 6):
        t_min = round(temp - random.uniform(2, 5), 1)
        t_max = round(temp + random.uniform(1, 4), 1)
        rp    = round(max(0, rain_prob + random.uniform(-20, 20)), 1)
        forecast.append(WeatherForecastItem(
            date=f"Day +{i}",
            temp_min=t_min,
            temp_max=t_max,
            humidity=round(humidity + random.uniform(-10, 10), 1),
            rain_probability=min(rp, 100),
            rainfall=round(random.uniform(0, 5), 1) if rp > 50 else 0.0,
            condition=random.choice(CONDITIONS),
        ))

    return WeatherResponse(
        current=WeatherCurrent(
            temperature=temp,
            feels_like=round(temp + random.uniform(-2, 3), 1),
            humidity=humidity,
            wind_speed=wind,
            rainfall=rainfall,
            rain_probability=rain_prob,
            condition=condition,
            description=f"{condition} conditions",
            city=CITY,
            timestamp=datetime.now(timezone.utc),
        ),
        forecast=forecast,
        source="mock",
    )


async def get_weather(city: str = None) -> WeatherResponse:
    target_city = city or CITY

    if not API_KEY or API_KEY == "your_openweathermap_api_key_here":
        return _mock_weather()

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Current weather
            cur_r = await client.get(f"{BASE_URL}/weather", params={
                "q": f"{target_city},{COUNTRY}",
                "appid": API_KEY,
                "units": "metric",
            })
            cur_r.raise_for_status()
            cur = cur_r.json()

            # 5-day forecast
            fc_r = await client.get(f"{BASE_URL}/forecast", params={
                "q": f"{target_city},{COUNTRY}",
                "appid": API_KEY,
                "units": "metric",
                "cnt": 40,
            })
            fc_r.raise_for_status()
            fc = fc_r.json()

        rain_now = cur.get("rain", {}).get("1h", 0.0)
        current  = WeatherCurrent(
            temperature   = cur["main"]["temp"],
            feels_like    = cur["main"]["feels_like"],
            humidity      = cur["main"]["humidity"],
            wind_speed    = cur["wind"]["speed"] * 3.6,  # m/s → km/h
            rainfall      = rain_now,
            rain_probability = min(100, rain_now * 12),  # rough estimate
            condition     = cur["weather"][0]["main"],
            description   = cur["weather"][0]["description"].capitalize(),
            icon          = cur["weather"][0]["icon"],
            city          = cur.get("name", target_city),
            timestamp     = datetime.now(timezone.utc),
        )

        # Group forecast by day (take noon reading per day)
        seen_days = set()
        forecast  = []
        for item in fc["list"]:
            day = item["dt_txt"][:10]
            if day in seen_days or len(forecast) >= 5:
                continue
            seen_days.add(day)
            rain_fc = item.get("rain", {}).get("3h", 0.0)
            pop     = item.get("pop", 0) * 100
            forecast.append(WeatherForecastItem(
                date             = day,
                temp_min         = item["main"]["temp_min"],
                temp_max         = item["main"]["temp_max"],
                humidity         = item["main"]["humidity"],
                rain_probability = round(pop, 1),
                rainfall         = round(rain_fc, 1),
                condition        = item["weather"][0]["main"],
                icon             = item["weather"][0]["icon"],
            ))

        return WeatherResponse(current=current, forecast=forecast, source="api")

    except Exception as e:
        print(f"[WARN] Weather API error: {e}. Using mock data.")
        return _mock_weather()
