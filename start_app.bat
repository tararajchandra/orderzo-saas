@echo off
echo Starting Ruchi Restaurant Application...
echo --------------------------------------

:: Change directory to the script's specific location to ensure we run in the project root
cd /d "%~dp0"

echo [1/2] Launching Next.js Development Server...
:: Opens a new command prompt window to run the server
start "Ruchi Server" cmd /k "npm run dev"

echo Waiting for server to initialize...
:: Wait 5 seconds to give the server time to start up
timeout /t 5 >nul

echo [2/2] Opening Google Chrome...
:: Launches Chrome pointing to localhost
start chrome http://localhost:3000

echo.
echo Application started! Minimized this window or close it if you're done.
