@echo off
echo ========================================
echo  Pinyin Annotation Tool - Quick Start
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    echo Please install Node.js (>= 14.0.0) from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

REM Create directories
if not exist "temp" mkdir temp
if not exist "logs" mkdir logs
if not exist "output" mkdir output

echo [OK] Directory structure checked
echo.
echo [INFO] Starting server...
echo.

REM Start server
call npm start

if %errorlevel% neq 0 (
    echo [ERROR] Server failed to start
    echo.
    echo Please check:
    echo 1. Port conflicts (80, 8080)
    echo 2. Administrator permissions
    echo 3. Error logs in logs directory
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Server started successfully!
echo [INFO] Browser should open automatically
echo.
pause