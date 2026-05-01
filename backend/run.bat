@echo off
REM Startup script for DetectSteel backend (Windows)

echo Launching DetectSteel Backend...

REM Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo Installing dependencies...
pip install -r requirements.txt -q

REM Start server
echo Starting Uvicorn server...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
