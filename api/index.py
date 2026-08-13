import os
import sys

# Ensure backend and ml-engine paths are added to Python path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
ML_DIR = os.path.join(ROOT_DIR, "ml-engine")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

from app.main import app  # noqa: E402
