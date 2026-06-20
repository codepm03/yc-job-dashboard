#!/bin/bash
# Start both backend and frontend servers

echo "Starting YC Job Dashboard..."
echo ""

# Start backend in background
echo "Starting backend on port 8001..."
cd "$(dirname "$0")/backend"
uvicorn main:app --port 8001 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start frontend
echo "Starting frontend on port 3000..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "  YC Job Dashboard is running!"
echo "========================================="
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8001"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "========================================="

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
