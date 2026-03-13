@echo off
TITLE Srujana Plagiarism Detector
echo Starting the Srujana Plagiarism Detector...

cd /d "%~dp0"

echo [1/2] Starting Backend Server (FastAPI)...
start "Backend API" cmd /c "python backend/app.py"
echo Backend started on port 8000.

echo [2/2] Starting Frontend Server (Vite)...
cd frontend
start "Frontend UI" cmd /c "npm run dev"
echo Frontend started on port 5173.

echo.
echo ==============================================
echo Srujana Plagiarism Detector is running!
echo Backend API : http://localhost:8000
echo Frontend UI : http://localhost:5173
echo ==============================================
echo.
echo Press any key to stop both servers and exit...
pause >nul

echo Stopping servers...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Backend API" >nul 2>&1
echo Done.
exit
