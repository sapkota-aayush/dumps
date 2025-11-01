#!/bin/bash
# Production Deployment Script for Dumps.online

set -e  # Exit on any error

echo "=================================================="
echo "Starting Dumps.online Production Deployment"
echo "=================================================="

# Navigate to project directory
cd /home/ubuntu/dumps

echo ""
echo "Step 1: Pulling latest code from GitHub..."
git pull origin main

echo ""
echo "Step 2: Setting up Backend..."
cd backend

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing Python dependencies..."
pip install -r ../requirements.txt --break-system-packages 2>/dev/null || pip install -r ../requirements.txt

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: backend/.env file is missing!"
    echo "Please create it with your DATABASE_URL and AWS credentials"
    exit 1
fi

# Kill any existing backend processes
echo "Stopping existing backend processes..."
pkill -f "uvicorn app.main:app" || true
sleep 2

# Start backend in screen
echo "Starting backend server in screen session 'backend'..."
screen -dmS backend bash -c "source venv/bin/activate && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "Backend is running!"
else
    echo "WARNING: Backend health check failed, but continuing..."
fi

echo ""
echo "Step 3: Setting up Frontend..."
cd /home/ubuntu/dumps/frontend/dumpster-dove

# Install dependencies
echo "Installing Node dependencies..."
npm install

# Build the frontend
echo "Building frontend for production..."
npm run build

# Verify build exists
if [ ! -d "dist" ]; then
    echo "ERROR: Frontend build failed - dist directory not found!"
    exit 1
fi

echo "Frontend built successfully!"

echo ""
echo "Step 4: Configuring Nginx..."
cd /home/ubuntu/dumps

# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/dumps

# Enable site if not already enabled
if [ ! -L /etc/nginx/sites-enabled/dumps ]; then
    sudo ln -s /etc/nginx/sites-available/dumps /etc/nginx/sites-enabled/
fi

# Test nginx config
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "Step 5: Checking Services Status..."

# Check PostgreSQL
if sudo systemctl is-active --quiet postgresql; then
    echo "PostgreSQL is running"
else
    echo "WARNING: PostgreSQL is not running. Starting..."
    sudo systemctl start postgresql
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    echo "Nginx is running"
else
    echo "WARNING: Nginx is not running. Starting..."
    sudo systemctl start nginx
fi

# Check Backend
if screen -list | grep -q "backend"; then
    echo "Backend screen session is active"
else
    echo "WARNING: Backend screen session not found"
fi

echo ""
echo "Step 6: Service URLs..."
echo "   Frontend: https://dumps.online"
echo "   Backend Health: https://dumps.online/api/posts/health"
echo "   Backend API: https://dumps.online/api/"

echo ""
echo "=================================================="
echo "Deployment Complete!"
echo "=================================================="
echo ""
echo "Useful commands:"
echo "  View backend logs:    screen -r backend"
echo "  Exit screen:          Ctrl+A then D"
echo "  Restart nginx:        sudo systemctl restart nginx"
echo "  Check nginx logs:     sudo tail -f /var/log/nginx/error.log"
echo ""

