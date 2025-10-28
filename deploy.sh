#!/bin/bash

# Dumps.online Deployment Script
echo "Starting Dumps.online deployment..."

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "Installing dependencies..."
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx git

# Install Node.js
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Set up PostgreSQL
echo "Setting up PostgreSQL database..."
echo "Please enter a secure password for the database user 'dumps_user':"
read -s DB_PASSWORD
echo ""

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE dumps_db;"
sudo -u postgres psql -c "CREATE USER dumps_user WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dumps_db TO dumps_user;"

# Clone repository
echo "Cloning repository..."
cd ~
rm -rf dumps
git clone https://github.com/sapkota-aayush/dumps.git
cd dumps

# Create environment file with the password
echo "DATABASE_URL=postgresql://dumps_user:$DB_PASSWORD@localhost:5432/dumps_db" > backend/.env

# Set up backend
echo "Setting up Python backend..."
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Set up frontend
echo "Setting up React frontend..."
cd frontend/dumpster-dove
npm install
npm run build
cd ../..

# Start backend
echo "Starting backend server..."
cd backend
source ../venv/bin/activate
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Set up Nginx
echo "Setting up Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx
sudo cp nginx.conf /etc/nginx/sites-available/dumps
sudo ln -s /etc/nginx/sites-available/dumps /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment complete! Your app should be running at http://16.52.134.125"
