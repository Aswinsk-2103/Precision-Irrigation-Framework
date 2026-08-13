"""
Data preprocessing: encoding, scaling, and train/test split.
"""
import pandas as pd
import numpy as np
import joblib
import os
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split

CATEGORICAL_FEATURES = ["soil_type", "crop_type", "growth_stage"]
NUMERIC_FEATURES = [
    "soil_moisture", "temperature", "humidity", "rainfall",
    "rain_probability", "wind_speed", "prev_irrigation", "hours_since_irrigation"
]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")


def load_and_preprocess(csv_path: str):
    df = pd.read_csv(csv_path)
    
    # Encode categoricals
    encoders = {}
    for col in CATEGORICAL_FEATURES:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    
    # Encode risk_level
    risk_enc = LabelEncoder()
    df["risk_level"] = risk_enc.fit_transform(df["risk_level"])
    encoders["risk_level"] = risk_enc
    
    X = df[ALL_FEATURES].values
    y_clf = df["irrigation_required"].values          # 0 or 1
    y_water = df["water_quantity"].values             # litres
    y_duration = df["duration_minutes"].values        # minutes
    y_risk = df["risk_level"].values                  # encoded int
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train/test split
    splits = train_test_split(
        X_scaled, y_clf, y_water, y_duration, y_risk,
        test_size=0.2, random_state=42, stratify=y_clf
    )
    X_train, X_test = splits[0], splits[1]
    y_clf_train, y_clf_test = splits[2], splits[3]
    y_water_train, y_water_test = splits[4], splits[5]
    y_dur_train, y_dur_test = splits[6], splits[7]
    y_risk_train, y_risk_test = splits[8], splits[9]
    
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, "scaler.pkl"))
    joblib.dump(encoders, os.path.join(ARTIFACTS_DIR, "encoders.pkl"))
    
    print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")
    print(f"Features: {ALL_FEATURES}")
    
    return {
        "X_train": X_train, "X_test": X_test,
        "y_clf_train": y_clf_train, "y_clf_test": y_clf_test,
        "y_water_train": y_water_train, "y_water_test": y_water_test,
        "y_dur_train": y_dur_train, "y_dur_test": y_dur_test,
        "y_risk_train": y_risk_train, "y_risk_test": y_risk_test,
        "encoders": encoders, "scaler": scaler,
        "feature_names": ALL_FEATURES,
    }


def preprocess_single(input_dict: dict, scaler, encoders) -> np.ndarray:
    """Preprocess a single prediction input."""
    row = {}
    for feat in NUMERIC_FEATURES:
        row[feat] = float(input_dict.get(feat, 0))
    for feat in CATEGORICAL_FEATURES:
        val = str(input_dict.get(feat, "Loamy" if feat == "soil_type" else "Wheat"))
        enc = encoders[feat]
        if val in enc.classes_:
            row[feat] = enc.transform([val])[0]
        else:
            row[feat] = 0  # default
    
    arr = np.array([[row[f] for f in ALL_FEATURES]])
    return scaler.transform(arr)
