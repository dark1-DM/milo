@echo off
echo Starting Discord Bot Dashboard...

echo.
echo Starting the bot...
start "Discord Bot" cmd /c "npm start"

echo.
echo Waiting 5 seconds for bot to initialize...
timeout /t 5 /nobreak > nul

echo.
echo Starting the dashboard...
cd dashboard
start "Dashboard" cmd /c "npm start"

echo.
echo Both applications are starting...
echo Bot: http://localhost:5000
echo Dashboard: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul