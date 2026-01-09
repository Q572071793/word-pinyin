@echo off
REM Set UTF-8 encoding
chcp 65001 >nul 2>&1

echo ========================================
echo  Pinyin Annotation Tool - Quick Start
echo ========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    echo Please install Node.js (>= 14.0.0)
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected

REM Install dependencies
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Installation failed
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies ready
)

REM Create folders
if not exist "temp" mkdir temp
if not exist "logs" mkdir logs
if not exist "output" mkdir output

echo [OK] Folders created
echo.
echo [INFO] Starting server...
echo.

REM Start the server
call npm start

if %errorlevel% neq 0 (
    echo [ERROR] Server failed
    echo.
    echo Check:
    echo 1. Port conflicts (80, 8080)
    echo 2. Admin permissions
    echo 3. Logs in logs folder
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Server started!
echo [INFO] Browser will open
echo.
pause