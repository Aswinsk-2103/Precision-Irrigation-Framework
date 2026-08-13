@echo off
echo ============================================
echo   Precision Irrigation - Backend Server
echo ============================================
cd /d "%~dp0backend"
pip install -r requirements.txt -q
uvicorn app.main:app --reload --port 8000
pause
