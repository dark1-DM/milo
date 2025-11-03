#!/bin/bash

echo "Installing Discord Bot Dashboard dependencies..."

echo ""
echo "Installing bot dependencies..."
cd bot
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install bot dependencies"
    exit 1
fi

echo ""
echo "Installing dashboard dependencies..."
cd ../dashboard
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install dashboard dependencies"
    exit 1
fi

echo ""
echo "All dependencies installed successfully!"
echo ""
echo "To start the bot: npm start"
echo "To start the dashboard: cd dashboard && npm start"