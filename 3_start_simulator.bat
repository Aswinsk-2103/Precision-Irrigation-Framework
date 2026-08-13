@echo off
echo ============================================
echo   Precision Irrigation - Sensor Simulator
echo ============================================
cd /d "%~dp0"
pip install httpx -q
python sensor-simulator/simulator.py
pause
