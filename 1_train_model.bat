@echo off
echo ============================================
echo   Precision Irrigation - ML Model Training
echo ============================================
cd /d "%~dp0"
pip install -r ml-engine/requirements.txt -q
python ml-engine/train.py
pause
