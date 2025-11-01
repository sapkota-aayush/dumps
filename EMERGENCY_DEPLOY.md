# 🚨 EMERGENCY DEPLOYMENT GUIDE

## Current Situation
- ✅ EC2 instance is running (AWS shows it's up)
- ✅ Domain is reachable (Cloudflare is working)
- ❌ Backend/Frontend services likely crashed or stopped

## IMMEDIATE ACTIONS

### Option 1: Force Restart Services (If you can SSH)

```bash
# SSH into your server
ssh -i ~/Downloads/new.pem ubuntu@$(dig +short dumps.online | grep -v '\.$' | head -1)

# Once connected, run:
cd /home/ubuntu/dumps
chmod +x deploy_production.sh
./deploy_production.sh
```

### Option 2: Restart EC2 (If SSH is frozen)

1. Go to: https://console.aws.amazon.com/ec2/
2. Select your instance
3. Click "Instance state" → "Reboot instance"
4. Wait 2-3 minutes
5. Then SSH and run the deployment script above

### Option 3: Force Kill Terminal Locally

If your Mac terminal is frozen:

```bash
# Open a NEW terminal window
# Kill any hung SSH connections
pkill -9 ssh

# Try connecting again
ssh -i ~/Downloads/new.pem ubuntu@$(dig +short dumps.online | grep -v '\.$' | head -1)
```

## Manual Service Restart (Once SSH works)

```bash
# 1. Check what's running
ps aux | grep -E "uvicorn|screen|node"

# 2. Kill all old processes
pkill -9 -f uvicorn
pkill -9 -f node
screen -wipe

# 3. Restart PostgreSQL (if needed)
sudo systemctl status postgresql
sudo systemctl restart postgresql

# 4. Start Backend
cd /home/ubuntu/dumps/backend
source venv/bin/activate
screen -dmS backend bash -c "source venv/bin/activate && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

# 5. Check backend health
curl http://localhost:8000/health

# 6. Rebuild and deploy frontend
cd /home/ubuntu/dumps/frontend/dumpster-dove
npm run build

# 7. Restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# 8. Test the site
curl -I https://dumps.online
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
cd /home/ubuntu/dumps/backend
source venv/bin/activate
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# Look for error messages
```

### Database connection error
```bash
# Check PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT 1;"

# Check .env file
cat /home/ubuntu/dumps/backend/.env
# Should have: DATABASE_URL=postgresql://dumps_user:Happy@890123@localhost:5432/dumps_db
```

### Nginx error
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check nginx config
sudo nginx -t

# Make sure config is linked
sudo ls -la /etc/nginx/sites-enabled/
```

### Frontend not building
```bash
cd /home/ubuntu/dumps/frontend/dumpster-dove
rm -rf node_modules dist
npm install
npm run build
```

## Quick Health Checks

```bash
# All services should show these:
sudo systemctl status postgresql  # active (running)
sudo systemctl status nginx       # active (running)
screen -list                      # Should show 'backend'
curl http://localhost:8000/health # {"status":"healthy"}
curl https://dumps.online         # Should return HTML
```

## If Nothing Works

### Nuclear Option - Full Reinstall
```bash
# 1. Backup database first!
sudo -u postgres pg_dump dumps_db > ~/backup.sql

# 2. Delete everything except .env
cd /home/ubuntu/dumps/backend
cp .env ~/env_backup
cd /home/ubuntu
rm -rf dumps

# 3. Clone fresh
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git dumps
cd dumps/backend
cp ~/env_backup .env

# 4. Run deployment script
cd /home/ubuntu/dumps
./deploy_production.sh
```

## Contact Info for AWS Support
- Check EC2 System Status: https://console.aws.amazon.com/ec2/
- Look for "Status Checks" - both should pass
- If hardware issues, AWS may need to migrate your instance

## Current Setup Verification

After deployment works, verify:
- [ ] https://dumps.online loads the frontend
- [ ] https://dumps.online/api/posts/health returns {"status":"healthy"}
- [ ] Can create new posts
- [ ] Can view posts
- [ ] Images upload correctly
- [ ] Hashtags work
- [ ] Mobile works

## Performance Check

Run Lighthouse audit after fixing:
- Performance should be 90+
- Accessibility should be 100
- Best Practices should be 100
- SEO should be 100

