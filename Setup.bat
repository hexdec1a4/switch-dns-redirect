@echo off
setlocal

REM Check for Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.6+ and try again.
    pause
    exit /b 1
) else (
    echo Python found.
)

REM Check for required folders and files
if not exist "games" (
    echo "games" folder not found. Creating...
    mkdir games
) else (
    echo "games" folder exists.
)

if not exist "switch.log" (
    echo "switch.log" not found. Creating empty log file...
    type nul > switch.log
) else (
    echo "switch.log" file exists.
)

if not exist "app.py" (
    echo ERROR: app.py not found! Please place app.py in this directory.
    pause
    exit /b 1
) else (
    echo app.py found.
)

if not exist "templates" (
    echo ERROR: templates folder not found! Please place your HTML templates there.
    pause
    exit /b 1
) else (
    echo templates folder found.
)

REM Install dependencies
echo Installing required Python packages...
pip install flask flask-socketio eventlet

echo Setup completed.
pause
