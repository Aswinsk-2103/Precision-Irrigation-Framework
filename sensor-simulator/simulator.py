"""
Realistic IoT Sensor Simulator for the Precision Irrigation System.
Continuously generates and POSTs sensor data to the FastAPI backend.

Usage:
    python simulator.py

Supports:
    - Diurnal temperature variation (warmer midday)
    - Moisture drift (slow decline between irrigations)
    - Random rainfall events
    - Configurable farm_id for multi-farm simulation
"""
import asyncio
import httpx
import math
import random
import time
from datetime import datetime

BACKEND_URL = "http://localhost:8000/api/sensor-data"
INTERVAL_SECONDS = 10   # POST every 10 seconds
FARM_ID = "default"

# State carries over between readings (realistic drift)
state = {
    "soil_moisture": 55.0,
    "temperature":   28.0,
    "humidity":      65.0,
    "rainfall":       0.0,
    "wind_speed":    10.0,
    "irrigation_on": False,
}


def simulate_step(ts: float) -> dict:
    """Advance simulation by one step using physics-inspired rules."""
    hour = datetime.fromtimestamp(ts).hour

    # ── Temperature: diurnal curve peaks ~14:00 ────────────────────
    temp_base   = 28.0
    temp_amp    = 8.0
    temp_cycle  = temp_amp * math.sin(math.pi * (hour - 6) / 12) if 6 <= hour <= 18 else -temp_amp * 0.3
    state["temperature"] = round(
        temp_base + temp_cycle + random.gauss(0, 0.4),
        2,
    )

    # ── Humidity: inversely related to temperature ──────────────────
    humidity_base = 70 - (state["temperature"] - 28) * 0.8
    state["humidity"] = round(
        max(20, min(98, humidity_base + random.gauss(0, 1.5))),
        2,
    )

    # ── Rainfall: random events ─────────────────────────────────────
    if random.random() < 0.05:  # 5% chance of rain event
        state["rainfall"] = round(random.uniform(1, 15), 2)
    else:
        state["rainfall"] = round(max(0, state["rainfall"] * 0.7), 2)

    # ── Soil moisture: drains slowly, refills on rain/irrigation ────
    evaporation   = 0.03 * (state["temperature"] / 30)
    rain_gain     = state["rainfall"] * 0.4
    irrigate_gain = 0.8 if state["irrigation_on"] else 0
    
    state["soil_moisture"] = round(
        max(5, min(100,
            state["soil_moisture"]
            - evaporation
            + rain_gain
            + irrigate_gain
            + random.gauss(0, 0.2)
        )),
        2,
    )

    # ── Wind speed ──────────────────────────────────────────────────
    state["wind_speed"] = round(
        max(0, min(60,
            state["wind_speed"] + random.gauss(0, 1.5)
        )),
        2,
    )

    # Rough rain probability from rainfall trend
    rain_prob = min(100, state["rainfall"] * 8 + random.uniform(5, 30))

    return {
        "soil_moisture":   state["soil_moisture"],
        "temperature":     state["temperature"],
        "humidity":        state["humidity"],
        "rainfall":        state["rainfall"],
        "rain_probability": round(rain_prob, 1),
        "wind_speed":      state["wind_speed"],
        "farm_id":         FARM_ID,
        "source":          "simulator",
    }


import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

async def run():
    print("=" * 55)
    print("  [Simulator] Precision Irrigation Sensor Simulator")
    print(f"  Posting to: {BACKEND_URL}")
    print(f"  Interval  : {INTERVAL_SECONDS}s")
    print(f"  Farm ID   : {FARM_ID}")
    print("  Press Ctrl+C to stop.")
    print("=" * 55)

    async with httpx.AsyncClient(timeout=5.0) as client:
        step = 0
        while True:
            ts   = time.time()
            data = simulate_step(ts)
            step += 1

            try:
                resp = await client.post(BACKEND_URL, json=data)
                status = "[OK]" if resp.status_code == 200 else f"[WARN] {resp.status_code}"
                print(
                    f"[{step:04d}] {status} | "
                    f"Moisture={data['soil_moisture']:.1f}% | "
                    f"Temp={data['temperature']:.1f}°C | "
                    f"Humidity={data['humidity']:.1f}% | "
                    f"Rain={data['rainfall']:.1f}mm"
                )
            except httpx.ConnectError:
                print(f"[{step:04d}] [ERROR] Cannot connect to backend. Is it running?")
            except Exception as e:
                print(f"[{step:04d}] [ERROR] Error: {e}")

            await asyncio.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    asyncio.run(run())
