@echo off
setlocal enabledelayedexpansion
color 0A
cls
echo ========================================
echo      Welcome to Switch Server Setup
echo ========================================
echo.
echo This script will detect your IP,
echo save it to ip.bin, and launch:
echo  - Flask server (app.py)
echo  - DNS spoofing server (dns-redirect.js)
echo.
pause

:: IP Detection
set "currentIP="
set "foundIP="

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip:~1!"
    echo Checking IP: !ip!
    
    echo !ip! | findstr /b /c:"192.168.56." >nul
    if errorlevel 1 (
        echo !ip! | findstr /b /c:"10." >nul
        if errorlevel 1 (
            set "currentIP=!ip!"
            set "foundIP=1"
        )
    )
)

if not defined foundIP (
    echo Could not find a valid IPv4 address.
    pause
    exit /b 1
)

echo Detected current IP: [%currentIP%]

:: Save to ip.bin
echo %currentIP% > ip.bin
echo Saved to ip.bin
echo.

:: Start Flask Server
echo Starting Flask server...
start "Flask Server" cmd /k "color 0A && python app.py"

:: Start DNS Spoof Server
echo Starting DNS spoof server...
start "DNS Spoof Server" cmd /k "color 0A && node C:\WBC\dns-redirect.js"

echo.
echo Servers are starting in new windows.
pause
