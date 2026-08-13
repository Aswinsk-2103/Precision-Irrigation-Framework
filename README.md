# 🌱 ML-Based Precision Irrigation Framework

> **Machine Learning-Based Precision Irrigation Framework Using Soil Sensor and Weather Data for Smart Water Management**

A complete, demo-ready AI-powered smart irrigation system that integrates IoT sensor simulation, real-time weather data, Random Forest Machine Learning, FastAPI backend, MongoDB, and a React dashboard.

---

## 🏗️ Project Architecture

```
precision-irrigation/
├── frontend/          → React 18 + Vite + Tailwind CSS + Recharts
├── backend/           → Python FastAPI + Motor (async MongoDB)
├── ml-engine/         → Random Forest training + prediction
├── sensor-simulator/  → Realistic IoT sensor simulator
└── docs/              → Architecture & API docs
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (running locally on port 27017)

---

### Step 1 — Train the ML Model

```bash
cd precision-irrigation
pip install -r ml-engine/requirements.txt
python ml-engine/train.py
```

This will:
1. Generate 5,000 synthetic agricultural samples
2. Train Random Forest Classifier (irrigation: yes/no)
3. Train Random Forest Regressors (water quantity + duration)
4. Save model artifacts to `ml-engine/artifacts/`

**Expected output:**
```
Accuracy  : ~0.92
Precision : ~0.91
Recall    : ~0.93
F1-Score  : ~0.92
Water Qty MAE  : ~1.8 litres
Duration  MAE  : ~1.1 minutes
```

---

### Step 2 — Start the Backend

```bash
cd precision-irrigation/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### Step 3 — Start the Sensor Simulator

```bash
cd precision-irrigation
pip install httpx
python sensor-simulator/simulator.py
```

Posts realistic sensor data every 10 seconds.

---

### Step 4 — Start the Frontend

```bash
cd precision-irrigation/frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

### Step 5 — Add Weather API Key (Optional)

1. Get a free key at https://openweathermap.org/api
2. Edit `backend/.env`:
   ```
   WEATHER_API_KEY=your_key_here
   WEATHER_CITY=Mumbai
   ```

Without a key, realistic simulated weather data is used automatically.

---

## 🧠 ML Pipeline

| Component | Technology | Purpose |
|---|---|---|
| Dataset | Synthetic (5,000 rows) | Training data generation |
| Preprocessing | LabelEncoder + StandardScaler | Feature encoding & normalization |
| Classifier | Random Forest (150 trees) | Irrigation Required: YES/NO |
| Regressor 1 | Random Forest (150 trees) | Water Quantity (litres) |
| Regressor 2 | Random Forest (100 trees) | Duration (minutes) |
| Explainability | Feature Importance + Reasons | "Why this decision?" |

### Features Used
`soil_moisture, temperature, humidity, rainfall, rain_probability, wind_speed, soil_type, crop_type, growth_stage, prev_irrigation, hours_since_irrigation`

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sensor-data` | Ingest sensor data |
| GET | `/api/sensor-data` | Get recent readings |
| GET | `/api/sensor-data/latest` | Latest sensor reading |
| GET | `/api/weather` | Current weather + forecast |
| POST | `/api/predict` | Run ML prediction |
| GET | `/api/predictions/history` | Prediction log |
| GET | `/api/irrigation-status` | Current irrigation state |
| POST | `/api/irrigation/control` | Turn pump ON/OFF |
| GET | `/api/irrigation-history` | Irrigation event log |
| GET | `/api/analytics` | Water usage analytics |
| GET | `/api/crops` | All crops with thresholds |
| POST | `/api/crops` | Add custom crop |
| POST | `/api/auth/login` | Login (farmer/admin) |

---

## 👤 Demo Credentials

| Role | Username | Password |
|---|---|---|
| Farmer | `farmer` | `farmer123` |
| Admin  | `admin`  | `admin123`  |

---

## 🌿 Supported Crops

Rice · Wheat · Tomato · Cotton · Maize · Sugarcane · Groundnut

Each crop has: optimal moisture range, minimum threshold, water requirement, and 5 growth stages.

---

## 📊 Dashboard Features

- **Dashboard** — KPI cards, auto-ML prediction, irrigation status, 5-day forecast
- **Live Sensors** — Real-time charts, animated value cards, auto-refresh
- **ML Prediction** — Full form, explainable AI, feature importance chart
- **Weather** — Current conditions, forecast, irrigation advisory
- **Irrigation** — ON/OFF control, AI recommendation, event log
- **Crops** — Select/manage 7+ crop types with growth stages
- **Analytics** — Water usage charts, moisture trends, efficiency score
- **History** — Irrigation events + ML prediction log
- **Settings** — Farm config, alert thresholds, API key setup

---

## 🔌 Extending to Real ESP32 Sensors

The backend endpoint `POST /api/sensor-data` accepts JSON in the same format as the simulator.
Your ESP32 sketch should POST to:

```
http://<backend-ip>:8000/api/sensor-data
```

With body:
```json
{
  "soil_moisture": 42.5,
  "temperature": 29.3,
  "humidity": 67.0,
  "rainfall": 0.0,
  "wind_speed": 8.2,
  "farm_id": "field-1",
  "source": "esp32"
}
```

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `ml-engine/train.py` | Train all ML models |
| `ml-engine/predict.py` | `IrrigationPredictor` class |
| `backend/app/main.py` | FastAPI application |
| `backend/app/routes/prediction.py` | ML prediction endpoint |
| `backend/.env` | Configuration (API key, DB URL) |
| `sensor-simulator/simulator.py` | IoT sensor simulator |
| `frontend/src/pages/Dashboard.jsx` | Main dashboard |
| `frontend/src/pages/MLPrediction.jsx` | Prediction UI |
