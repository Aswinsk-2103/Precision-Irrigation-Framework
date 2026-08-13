"""
Generate a realistic synthetic agricultural dataset for irrigation prediction.
Produces ~5000 rows covering diverse crop, soil, and weather conditions.
"""
import numpy as np
import pandas as pd
import os

np.random.seed(42)
N = 5000

SOIL_TYPES = ["Sandy", "Loamy", "Clay", "Silty", "Peaty"]
CROP_TYPES = ["Rice", "Wheat", "Tomato", "Cotton", "Maize", "Sugarcane", "Groundnut"]
GROWTH_STAGES = ["Germination", "Vegetative", "Flowering", "Fruiting", "Maturity"]
RISK_LEVELS = ["Low", "Medium", "High"]

# Crop-specific moisture thresholds (min_moisture, optimal_min, optimal_max)
CROP_THRESHOLDS = {
    "Rice":      (60, 70, 85),
    "Wheat":     (35, 45, 65),
    "Tomato":    (40, 55, 70),
    "Cotton":    (30, 45, 60),
    "Maize":     (40, 55, 70),
    "Sugarcane": (55, 65, 80),
    "Groundnut": (30, 40, 60),
}

# Soil type affects water retention factor
SOIL_RETENTION = {
    "Sandy": 0.6,
    "Loamy": 1.0,
    "Clay":  1.3,
    "Silty": 1.1,
    "Peaty": 0.9,
}

def generate_row():
    crop = np.random.choice(CROP_TYPES)
    soil = np.random.choice(SOIL_TYPES)
    stage = np.random.choice(GROWTH_STAGES)
    
    min_thresh, opt_min, opt_max = CROP_THRESHOLDS[crop]
    retention = SOIL_RETENTION[soil]
    
    # Environmental conditions
    temperature = np.random.uniform(15, 45)
    humidity = np.random.uniform(20, 95)
    rainfall = np.random.exponential(scale=3)  # mostly low rainfall
    rain_probability = np.random.uniform(0, 100)
    wind_speed = np.random.uniform(0, 40)
    
    # Soil moisture: biased based on recent rain and crop thresholds
    if rain_probability > 60:
        soil_moisture = np.random.uniform(opt_min, 95)
    else:
        soil_moisture = np.random.uniform(min_thresh - 20, opt_max + 10)
    soil_moisture = np.clip(soil_moisture, 5, 100)
    
    prev_irrigation = np.random.uniform(0, 30)  # litres
    hours_since_irrigation = np.random.uniform(0, 72)
    
    # --- Decision Logic ---
    needs_water = False
    water_qty = 0.0
    duration = 0.0
    
    moisture_deficit = opt_min - soil_moisture
    
    # Do not irrigate if rain expected or soil is already moist
    if rain_probability > 70 or rainfall > 8:
        needs_water = False
    elif soil_moisture < min_thresh:
        needs_water = True
    elif soil_moisture < opt_min and rain_probability < 40:
        needs_water = True
    elif soil_moisture > opt_max:
        needs_water = False
    else:
        # ML-style probabilistic decision
        score = (
            (opt_min - soil_moisture) / opt_min * 40
            + (temperature - 25) / 20 * 20
            - rain_probability * 0.3
            + (hours_since_irrigation / 24) * 10
        )
        needs_water = score > 15
    
    if needs_water:
        # Water quantity based on deficit, crop, soil retention
        base_water = max(5, moisture_deficit * retention * 0.8 + np.random.normal(0, 2))
        # Growth stage multiplier
        stage_mult = {"Germination": 0.6, "Vegetative": 0.9, "Flowering": 1.2, "Fruiting": 1.1, "Maturity": 0.7}
        water_qty = round(base_water * stage_mult.get(stage, 1.0), 1)
        water_qty = np.clip(water_qty, 5, 50)
        duration = round(water_qty * 0.6 + np.random.normal(0, 1), 1)
        duration = np.clip(duration, 3, 35)
    
    # Risk level
    if soil_moisture < min_thresh - 10 or (temperature > 38 and soil_moisture < opt_min):
        risk = "High"
    elif soil_moisture < opt_min or temperature > 33:
        risk = "Medium"
    else:
        risk = "Low"
    
    # Add slight noise
    soil_moisture = round(soil_moisture + np.random.normal(0, 0.5), 2)
    temperature = round(temperature + np.random.normal(0, 0.3), 2)
    humidity = round(humidity + np.random.normal(0, 0.5), 2)
    
    return {
        "soil_moisture": np.clip(soil_moisture, 5, 100),
        "temperature": np.clip(temperature, 10, 50),
        "humidity": np.clip(humidity, 10, 100),
        "rainfall": round(rainfall, 2),
        "rain_probability": round(rain_probability, 1),
        "wind_speed": round(wind_speed, 1),
        "soil_type": soil,
        "crop_type": crop,
        "growth_stage": stage,
        "prev_irrigation": round(prev_irrigation, 1),
        "hours_since_irrigation": round(hours_since_irrigation, 1),
        "irrigation_required": int(needs_water),
        "water_quantity": water_qty,
        "duration_minutes": duration,
        "risk_level": risk,
    }

def main():
    print(f"Generating {N} agricultural data samples...")
    rows = [generate_row() for _ in range(N)]
    df = pd.DataFrame(rows)
    
    out_path = os.path.join(os.path.dirname(__file__), "irrigation_dataset.csv")
    df.to_csv(out_path, index=False)
    
    print(f"Dataset saved to: {out_path}")
    print(f"\nShape: {df.shape}")
    print(f"\nIrrigation Required distribution:\n{df['irrigation_required'].value_counts()}")
    print(f"\nRisk Level distribution:\n{df['risk_level'].value_counts()}")
    print(f"\nSample rows:\n{df.head(3).to_string()}")

if __name__ == "__main__":
    main()
