"""
Train Random Forest Classifier + Regressors for irrigation prediction.
Saves model artifacts to ml-engine/artifacts/
"""
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_absolute_error, mean_squared_error, classification_report,
)
import sys

# Add parent dir to path
sys.path.insert(0, os.path.dirname(__file__))
from preprocessing import load_and_preprocess, ARTIFACTS_DIR
from dataset.generate_dataset import main as generate_data

DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset", "irrigation_dataset.csv")


def train():
    # Generate dataset if not present
    if not os.path.exists(DATASET_PATH):
        print("Dataset not found. Generating...")
        generate_data()
    
    print("=" * 60)
    print("  ML-Based Precision Irrigation — Model Training")
    print("=" * 60)
    
    data = load_and_preprocess(DATASET_PATH)
    
    X_train = data["X_train"]
    X_test  = data["X_test"]
    
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    
    # ── 1. Irrigation Required Classifier ─────────────────────────
    print("\n[1/3] Training Irrigation Classifier (Random Forest)...")
    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, data["y_clf_train"])
    y_pred_clf = clf.predict(X_test)
    y_prob_clf = clf.predict_proba(X_test)[:, 1]
    
    acc  = accuracy_score(data["y_clf_test"], y_pred_clf)
    prec = precision_score(data["y_clf_test"], y_pred_clf, zero_division=0)
    rec  = recall_score(data["y_clf_test"], y_pred_clf, zero_division=0)
    f1   = f1_score(data["y_clf_test"], y_pred_clf, zero_division=0)
    
    print(f"  Accuracy  : {acc:.4f}")
    print(f"  Precision : {prec:.4f}")
    print(f"  Recall    : {rec:.4f}")
    print(f"  F1-Score  : {f1:.4f}")
    print("\n  Full Report:")
    print(classification_report(data["y_clf_test"], y_pred_clf, target_names=["No Irrigation", "Irrigate"]))
    
    joblib.dump(clf, os.path.join(ARTIFACTS_DIR, "model_classifier.pkl"))
    
    # ── 2. Water Quantity Regressor ────────────────────────────────
    print("\n[2/3] Training Water Quantity Regressor (Random Forest)...")
    reg_water = RandomForestRegressor(
        n_estimators=150,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )
    # Only train on rows where irrigation is required
    mask_train = data["y_clf_train"] == 1
    mask_test  = data["y_clf_test"]  == 1
    
    if mask_train.sum() > 10:
        reg_water.fit(X_train[mask_train], data["y_water_train"][mask_train])
        y_pred_water = reg_water.predict(X_test[mask_test])
        mae_w  = mean_absolute_error(data["y_water_test"][mask_test], y_pred_water)
        rmse_w = np.sqrt(mean_squared_error(data["y_water_test"][mask_test], y_pred_water))
        print(f"  Water Qty MAE  : {mae_w:.4f} litres")
        print(f"  Water Qty RMSE : {rmse_w:.4f} litres")
    else:
        reg_water.fit(X_train, data["y_water_train"])
        print("  Trained on full dataset (not enough positives)")
    
    joblib.dump(reg_water, os.path.join(ARTIFACTS_DIR, "model_regressor_water.pkl"))
    
    # ── 3. Duration Regressor ──────────────────────────────────────
    print("\n[3/3] Training Duration Regressor (Random Forest)...")
    reg_duration = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        random_state=42,
        n_jobs=-1,
    )
    if mask_train.sum() > 10:
        reg_duration.fit(X_train[mask_train], data["y_dur_train"][mask_train])
        y_pred_dur = reg_duration.predict(X_test[mask_test])
        mae_d  = mean_absolute_error(data["y_dur_test"][mask_test], y_pred_dur)
        rmse_d = np.sqrt(mean_squared_error(data["y_dur_test"][mask_test], y_pred_dur))
        print(f"  Duration MAE   : {mae_d:.4f} minutes")
        print(f"  Duration RMSE  : {rmse_d:.4f} minutes")
    else:
        reg_duration.fit(X_train, data["y_dur_train"])
    
    joblib.dump(reg_duration, os.path.join(ARTIFACTS_DIR, "model_regressor_duration.pkl"))
    
    # ── Save feature importances ───────────────────────────────────
    importance = dict(zip(data["feature_names"], clf.feature_importances_.tolist()))
    joblib.dump(importance, os.path.join(ARTIFACTS_DIR, "feature_importance.pkl"))
    
    print(f"\n" + "=" * 60)
    print(f"  Model artifacts saved to: {ARTIFACTS_DIR}")
    print(f"  [OK] model_classifier.pkl")
    print(f"  [OK] model_regressor_water.pkl")
    print(f"  [OK] model_regressor_duration.pkl")
    print(f"  [OK] scaler.pkl")
    print(f"  [OK] encoders.pkl")
    print(f"  [OK] feature_importance.pkl")
    print("=" * 60)
    print("\nTraining complete!")


if __name__ == "__main__":
    train()
