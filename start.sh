#!/bin/bash

echo "🚀 Starting FPL Companion..."
echo ""
echo "Building and starting Docker containers..."
echo ""

docker-compose up --build

echo ""
echo "✅ FPL Companion is running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 Redis: localhost:6379"
echo ""
echo "Press Ctrl+C to stop"
