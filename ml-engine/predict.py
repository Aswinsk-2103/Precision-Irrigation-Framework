"""
Prediction engine — loads trained model artifacts and exposes IrrigationPredictor.
Used by the FastAPI backend prediction route.
"""
import os
import joblib
import numpy as np
from typing import Dict, Any

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

RISK_MAP = {0: "High", 1: "Low", 2: "Medium"}  # LabelEncoder alphabetical order

class IrrigationPredictor:
    """Loads artifacts once and provides fast prediction."""
    
    def __init__(self):
        self._loaded = False
        self.clf = None
        self.reg_water = None
        self.reg_duration = None
        self.scaler = None
        self.encoders = None
        self.feature_importance: Dict[str, float] = {}
    
    def load(self):
        """Load all model artifacts from disk."""
        if self._loaded:
            return
        
        try:
            self.clf           = joblib.load(os.path.join(ARTIFACTS_DIR, "model_classifier.pkl"))
            self.reg_water     = joblib.load(os.path.join(ARTIFACTS_DIR, "model_regressor_water.pkl"))
            self.reg_duration  = joblib.load(os.path.join(ARTIFACTS_DIR, "model_regressor_duration.pkl"))
            self.scaler        = joblib.load(os.path.join(ARTIFACTS_DIR, "scaler.pkl"))
            self.encoders      = joblib.load(os.path.join(ARTIFACTS_DIR, "encoders.pkl"))
            fi_raw             = joblib.load(os.path.join(ARTIFACTS_DIR, "feature_importance.pkl"))
            
            # Normalise importance to 0–100
            total = sum(fi_raw.values()) or 1
            self.feature_importance = {k: round(v / total * 100, 2) for k, v in fi_raw.items()}
            self._loaded = True
            print("[OK] ML models loaded successfully.")
        except FileNotFoundError as e:
            raise RuntimeError(
                f"Model artifacts not found: {e}. "
                "Run `python ml-engine/train.py` first."
            )
    
    def _encode_input(self, inp: Dict[str, Any]) -> np.ndarray:
        from preprocessing import NUMERIC_FEATURES, CATEGORICAL_FEATURES, ALL_FEATURES
        
        row = {}
        for feat in NUMERIC_FEATURES:
            row[feat] = float(inp.get(feat, 0))
        for feat in CATEGORICAL_FEATURES:
            val = str(inp.get(feat, "Loamy" if feat == "soil_type" else "Wheat"))
            enc = self.encoders[feat]
            row[feat] = enc.transform([val])[0] if val in enc.classes_ else 0
        
        arr = np.array([[row[f] for f in ALL_FEATURES]])
        return self.scaler.transform(arr)
    
    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict irrigation requirements.
        Returns:
            irrigation_required: bool
            water_quantity: float (litres)
            duration_minutes: float
            risk_level: str
            confidence: float (0-100)
            feature_importance: dict
            reasons: list[str]
        """
        self.load()
        
        X = self._encode_input(input_data)
        
        # Classification
        irr_prob = self.clf.predict_proba(X)[0][1]
        irr_required = bool(irr_prob >= 0.5)
        
        # Regression (only meaningful when irrigation required)
        water_qty = 0.0
        duration  = 0.0
        if irr_required:
            water_qty = float(np.clip(self.reg_water.predict(X)[0], 3, 60))
            duration  = float(np.clip(self.reg_duration.predict(X)[0], 2, 40))
        
        # Risk level
        sm = float(input_data.get("soil_moisture", 50))
        temp = float(input_data.get("temperature", 25))
        rain_prob = float(input_data.get("rain_probability", 30))
        crop = input_data.get("crop_type", "Wheat")
        
        CROP_MIN = {
            "Rice": 60, "Wheat": 35, "Tomato": 40, "Cotton": 30,
            "Maize": 40, "Sugarcane": 55, "Groundnut": 30
        }
        min_thresh = CROP_MIN.get(crop, 40)
        
        if sm < min_thresh - 10 or (temp > 38 and sm < min_thresh):
            risk = "High"
        elif sm < min_thresh or temp > 33:
            risk = "Medium"
        else:
            risk = "Low"
        
        # Generate human-readable reasons
        reasons = self._build_reasons(input_data, irr_required, risk, irr_prob)
        
        return {
            "irrigation_required": irr_required,
            "water_quantity": round(water_qty, 1),
            "duration_minutes": round(duration, 1),
            "risk_level": risk,
            "confidence": round(irr_prob * 100 if irr_required else (1 - irr_prob) * 100, 1),
            "feature_importance": self.feature_importance,
            "reasons": reasons,
        }
    
    def _build_reasons(self, inp, irr_required, risk, prob):
        reasons = []
        sm       = float(inp.get("soil_moisture", 50))
        temp     = float(inp.get("temperature", 25))
        humidity = float(inp.get("humidity", 50))
        rain_p   = float(inp.get("rain_probability", 30))
        rainfall = float(inp.get("rainfall", 0))
        hours    = float(inp.get("hours_since_irrigation", 24))
        crop     = inp.get("crop_type", "Wheat")
        stage    = inp.get("growth_stage", "Vegetative")
        
        CROP_MIN = {"Rice":60,"Wheat":35,"Tomato":40,"Cotton":30,"Maize":40,"Sugarcane":55,"Groundnut":30}
        thresh   = CROP_MIN.get(crop, 40)
        
        if sm < thresh:
            reasons.append(f"Soil moisture ({sm:.1f}%) is critically below {crop} threshold ({thresh}%)")
        elif sm < thresh + 10:
            reasons.append(f"Soil moisture ({sm:.1f}%) is approaching minimum threshold")
        else:
            reasons.append(f"Soil moisture ({sm:.1f}%) is adequate")
        
        if temp > 35:
            reasons.append(f"High temperature ({temp:.1f}°C) increases evapotranspiration")
        elif temp < 20:
            reasons.append(f"Moderate temperature ({temp:.1f}°C) — low water stress")
        
        if rain_p > 70:
            reasons.append(f"High rain probability ({rain_p:.0f}%) — irrigation not needed")
        elif rain_p > 40:
            reasons.append(f"Moderate rain probability ({rain_p:.0f}%) — monitor closely")
        else:
            reasons.append(f"Low rain probability ({rain_p:.0f}%) — no natural water expected")
        
        if rainfall > 8:
            reasons.append(f"Recent rainfall ({rainfall:.1f}mm) reduces irrigation need")
        
        if hours > 48:
            reasons.append(f"Long time since last irrigation ({hours:.0f} hours)")
        
        if stage in ["Flowering", "Fruiting"]:
            reasons.append(f"Crop is in critical {stage} stage — water stress risk is high")
        
        if humidity < 35:
            reasons.append(f"Low humidity ({humidity:.0f}%) increases water demand")
        
        return reasons


# Singleton instance (loaded once by FastAPI at startup)
predictor = IrrigationPredictor()
