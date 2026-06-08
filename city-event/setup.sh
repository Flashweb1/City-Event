#!/bin/bash

echo "🌆 CITY EVENT - Quick Start"
echo "=============================="
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

echo "=============================="
echo "🚀 Installation Complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm start"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Demo Account:"
echo "  Email: demo@cityevent.com"
echo "  Password: password123"
echo ""
echo "=============================="
