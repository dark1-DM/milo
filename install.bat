@echo off
echo Installing Discord Bot Dashboard dependencies...

echo.
echo Installing bot dependencies...
cd bot
npm install
if %errorlevel% neq 0 (
    echo Failed to install bot dependencies
    pause
    exit /b 1
)

echo.
echo Installing dashboard dependencies...
cd ../dashboard
npm install
if %errorlevel% neq 0 (
    echo Failed to install dashboard dependencies
    pause
    exit /b 1
)

echo.
echo All dependencies installed successfully!
echo.
echo To start the bot: npm start
echo To start the dashboard: cd dashboard && npm start
echo.
pause