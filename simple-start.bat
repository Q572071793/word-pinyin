@echo off
echo Starting Pinyin Annotation Tool...
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Create directories
mkdir temp 2>nul
mkdir logs 2>nul
mkdir output 2>nul

echo Starting server...
echo.

REM Start server
npm start

pause