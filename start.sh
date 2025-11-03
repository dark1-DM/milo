#!/bin/bash

echo "Starting Discord Bot Dashboard..."

echo ""
echo "Starting the bot..."
npm start &
BOT_PID=$!

echo ""
echo "Waiting 5 seconds for bot to initialize..."
sleep 5

echo ""
echo "Starting the dashboard..."
cd dashboard
npm start &
DASHBOARD_PID=$!

echo ""
echo "Both applications are running..."
echo "Bot: http://localhost:5000"
echo "Dashboard: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both applications"

# Wait for both processes
wait $BOT_PID $DASHBOARD_PID