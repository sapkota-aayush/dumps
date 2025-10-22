#!/bin/bash

# Dumps.online Deployment Script
echo "🚀 Starting Dumps.online deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "🔧 Installing dependencies..."
sudo apt install -y python3.9 python3.9-pip python3.9-venv postgresql postgresql-contrib nginx git

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install AWS CLI
echo "☁️ Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install -y unzip
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Set up PostgreSQL
echo "🗄️ Setting up PostgreSQL database..."
echo "Please enter a secure password for the database user 'dumps_user':"
read -s DB_PASSWORD
echo ""

sudo -u postgres psql -c "CREATE DATABASE dumps_db;"
sudo -u postgres psql -c "CREATE USER dumps_user WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dumps_db TO dumps_user;"

# Create environment file with the password
echo "DATABASE_URL=postgresql://dumps_user:$DB_PASSWORD@localhost:5432/dumps_db" > backend/.env

# Clone repository
echo "📁 Cloning repository..."
cd ~
git clone https://github.com/sapkota-aayush/dumps.git
cd dumps

# Set up backend
echo "🐍 Setting up Python backend..."
python3.9 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Set up frontend
echo "⚛️ Setting up React frontend..."
cd frontend/dumpster-dove
npm install
npm run build
cd ../..

# Environment file already created above with secure password
echo "🔐 Environment file created with secure database credentials"

# Start backend
echo "🚀 Starting backend server..."
cd backend
source ../venv/bin/activate
python3.9 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Set up Nginx
echo "🌐 Setting up Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/dumps
sudo ln -s /etc/nginx/sites-available/dumps /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "✅ Deployment complete! Your app should be running at http://your-ec2-ip"
