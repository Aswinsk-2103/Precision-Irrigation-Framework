# API Reference — Precision Irrigation System

Base URL: `http://localhost:8000`

Interactive Docs: `http://localhost:8000/docs`

---

## Sensor Data

### POST /api/sensor-data
Ingest sensor data from simulator, ESP32, or manual input.

**Request Body:**
```json
{
  "soil_moisture": 42.5,
  "temperature": 29.3,
  "humidity": 67.0,
  "rainfall": 0.0,
  "rain_probability": 15.0,
  "wind_speed": 8.2,
  "farm_id": "default",
  "source": "simulator"
}
```

**Response:**
```json
{ "id": "abc123", "status": "ok", "timestamp": "2024-01-01T10:00:00Z" }
```

---

### GET /api/sensor-data
Get recent sensor readings.

**Query Params:** `limit=50`, `farm_id=default`

---

### GET /api/sensor-data/latest
Get the single most recent sensor reading for a farm.

**Query Params:** `farm_id=default`

---

## ML Prediction

### POST /api/predict
Run the Random Forest ML prediction.

**Request Body:**
```json
{
  "soil_moisture": 28.0,
  "temperature": 35.0,
  "humidity": 55.0,
  "rainfall": 0.0,
  "rain_probability": 5.0,
  "wind_speed": 12.0,
  "soil_type": "Loamy",
  "crop_type": "Wheat",
  "growth_stage": "Flowering",
  "prev_irrigation": 0.0,
  "hours_since_irrigation": 36.0,
  "farm_id": "default"
}
```

**Response:**
```json
{
  "irrigation_required": true,
  "water_quantity": 20.5,
  "duration_minutes": 13.2,
  "risk_level": "High",
  "confidence": 94.3,
  "feature_importance": {
    "soil_moisture": 38.2,
    "rain_probability": 22.1,
    "temperature": 15.3
  },
  "reasons": [
    "Soil moisture (28.0%) is critically below Wheat threshold (35%)",
    "High temperature (35.0°C) increases evapotranspiration",
    "Low rain probability (5%) — no natural water expected"
  ],
  "recommendation_text": "Irrigation Required — Wheat needs approximately 20.5 litres over 13.2 minutes."
}
```

---

## Weather

### GET /api/weather
Get current weather and 5-day forecast.

**Query Params:** `city=Mumbai` (optional)

---

## Irrigation Control

### GET /api/irrigation-status
Get current irrigation state and today's statistics.

### POST /api/irrigation/control
Turn pump ON or OFF.

```json
{ "action": "on", "farm_id": "default", "triggered_by": "manual" }
{ "action": "off", "farm_id": "default", "triggered_by": "manual" }
```

### GET /api/irrigation-history
Get irrigation event log. Query: `limit=50`, `farm_id=default`

---

## Analytics

### GET /api/analytics
Get water usage and sensor trend analytics.

**Query Params:** `farm_id=default`, `days=7`

**Response includes:**
- `summary`: total water used, sessions, predictions count
- `daily_water`: per-day water consumption array
- `moisture_trend`: hourly soil moisture, temperature, humidity

---

## Crops

### GET /api/crops
Get all crops (seeds 7 defaults on first call).

### POST /api/crops
Add a custom crop.

```json
{
  "name": "Soybean",
  "optimal_moisture_min": 50,
  "optimal_moisture_max": 70,
  "min_moisture_threshold": 35,
  "typical_water_requirement": 18,
  "growth_stages": []
}
```

### GET /api/crops/{crop_name}
Get a specific crop by name.

---

## Authentication

### POST /api/auth/login
```json
{ "username": "farmer", "password": "farmer123" }
```
Returns JWT token + user info.

### POST /api/auth/register
Create a new user account.

---

## Error Responses

| Code | Meaning |
|------|---------|
| 400  | Bad request / validation error |
| 401  | Unauthorized |
| 404  | Resource not found |
| 503  | ML model not loaded — run train.py |
