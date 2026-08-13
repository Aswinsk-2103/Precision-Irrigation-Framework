"""
FastAPI main application — Precision Irrigation System Backend
"""
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# ── Add ml-engine to path so predict.py is importable ─────────────
ML_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../ml-engine"))
if ML_PATH not in sys.path:
    sys.path.insert(0, ML_PATH)

from app.database.connection import connect_db, close_db
from app.routes import sensor, prediction, irrigation, weather, analytics, crops, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    # Eagerly load ML model (fail fast if not trained)
    try:
        from predict import predictor
        predictor.load()
    except Exception as e:
        print(f"[WARN] ML model not loaded at startup: {e}")
        print("   Run `python ml-engine/train.py` to train the model.")
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Precision Irrigation API",
    description="ML-Based Smart Irrigation System — IoT + Weather + AI",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (allow React dev server) ──────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ──────────────────────────────────────────────────
app.include_router(sensor.router)
app.include_router(prediction.router)
app.include_router(irrigation.router)
app.include_router(weather.router)
app.include_router(analytics.router)
app.include_router(crops.router)
app.include_router(auth.router)


@app.get("/")
async def root():
    return {
        "message": "🌱 Precision Irrigation API is running",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
