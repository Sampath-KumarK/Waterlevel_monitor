# 🚀 Deployment Guide - Water Level Monitoring System

Complete step-by-step guide to deploy your water level monitoring system.

## Table of Contents
1. [MongoDB Atlas Setup](#mongodb-atlas-setup)
2. [Backend Deployment (Render)](#backend-deployment)
3. [Frontend Deployment (Render)](#frontend-deployment)
4. [ESP32 Configuration](#esp32-configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 1. MongoDB Atlas Setup

### Step 1: Create Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email

### Step 2: Create Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0 Sandbox)
3. Select your preferred cloud provider and region
4. Click "Create Cluster" (takes 2-3 minutes)

### Step 3: Create Database User
1. Click "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and generate strong password
5. Set "Built-in Role" to "Read and write to any database"
6. Click "Add User"

**📝 Save these credentials - you'll need them!**

### Step 4: Configure Network Access
1. Click "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
4. Click "Confirm"

⚠️ **Note**: For production, restrict to specific IPs

### Step 5: Get Connection String
1. Click "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `watermonitor`

**Example:**
```
mongodb+srv://myuser:mypassword123@cluster0.xxxxx.mongodb.net/watermonitor?retryWrites=true&w=majority
```

---

## 2. Backend Deployment (Render)

### Step 1: Prepare Backend
1. Ensure your backend code is pushed to GitHub
2. Make sure `backend/package.json` has:
   ```json
   {
     "scripts": {
       "start": "node server.js"
     }
   }
   ```

### Step 2: Create Render Account
1. Go to [Render](https://dashboard.render.com/register)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 3: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure service:

**Basic Settings:**
- **Name**: `water-monitor-api` (or your preferred name)
- **Region**: Choose closest to you
- **Branch**: `main` (or your default branch)
- **Root Directory**: `final/backend`
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select "Free"

### Step 4: Add Environment Variables
Click "Environment" → "Add Environment Variable"

Add these variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes on first deploy)
3. Watch the logs for any errors
4. Once deployed, you'll see "Live" status
5. **Copy your backend URL** (e.g., `https://water-monitor-api.onrender.com`)

### Step 6: Test Backend
Open in browser or use curl:
```bash
curl https://your-app-name.onrender.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "Water Level Monitoring System API is running"
}
```

---

## 3. Frontend Deployment (Render)

### Step 1: Update API URL
1. In your local project, create `.env.production` in `final/` directory:
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
2. Commit and push to GitHub

### Step 2: Create Static Site
1. Go to Render Dashboard
2. Click "New +" → "Static Site"
3. Select your repository

**Configure:**

**Basic Settings:**
- **Name**: `water-monitor-app`
- **Branch**: `main`
- **Root Directory**: `final`

**Build Settings:**
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Step 3: Add Environment Variable
Under "Environment":

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend-url.onrender.com/api` |

### Step 4: Deploy
1. Click "Create Static Site"
2. Wait for build and deployment (3-5 minutes)
3. Your app will be live at `https://water-monitor-app.onrender.com`

### Step 5: Test Frontend
1. Open the URL in your browser
2. You should see the water level gauge
3. It may show "No data available" initially (normal)

---

## 4. ESP32 Configuration

### Hardware Setup
**Components:**
- ESP32 development board
- HC-SR04 ultrasonic sensor
- Jumper wires
- USB cable for programming

**Wiring:**
```
HC-SR04 → ESP32
VCC     → 5V
GND     → GND
TRIG    → GPIO 5
ECHO    → GPIO 18
```

### Software Setup

1. **Install Arduino IDE**
   - Download from [arduino.cc](https://www.arduino.cc/en/software)
   - Install ESP32 board support

2. **Install Required Libraries**
   - Open Arduino IDE
   - Go to Tools → Manage Libraries
   - Search and install:
     - `ArduinoJson` by Benoit Blanchon

3. **Upload Code**
   - Copy the ESP32 code from README.md
   - Update these values:
     ```cpp
     const char* ssid = "YOUR_WIFI_SSID";
     const char* password = "YOUR_WIFI_PASSWORD";
     const char* serverUrl = "https://your-backend-url.onrender.com/api/water-level/update";
     ```
   - Select your ESP32 board: Tools → Board → ESP32 Dev Module
   - Select COM port: Tools → Port → (your ESP32 port)
   - Click Upload

4. **Monitor Serial Output**
   - Open Serial Monitor (Tools → Serial Monitor)
   - Set baud rate to 115200
   - You should see connection logs and data being sent

---

## 5. Testing

### Test Flow
1. **Power on ESP32**: Check serial monitor for WiFi connection
2. **Wait 30 seconds**: ESP32 sends first data
3. **Check Backend Logs**: In Render dashboard, view logs
4. **Check Frontend**: Refresh browser, should show water level
5. **Test Full Alert**: Manually update to 100% via API

### Manual API Test
```bash
# Update to 100% (should trigger FULL alert)
curl -X POST https://your-backend-url.onrender.com/api/water-level/update \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"ESP32-001","waterLevel":100}'

# Update to 0% (should trigger EMPTY event)
curl -X POST https://your-backend-url.onrender.com/api/water-level/update \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"ESP32-001","waterLevel":0}'

# Check history
curl https://your-backend-url.onrender.com/api/history
```

---

## 6. Troubleshooting

### Backend Issues

**Problem: "Application failed to respond"**
- **Solution**: Check Render logs for errors
- Verify MongoDB connection string is correct
- Ensure all environment variables are set

**Problem: MongoDB connection timeout**
- **Solution**: 
  - Check IP whitelist includes `0.0.0.0/0`
  - Verify database user credentials
  - Test connection string locally first

**Problem: 503 Service Unavailable**
- **Solution**: Free tier sleeps after 15 min inactivity
- Wait 30 seconds for cold start
- Consider keeping service awake with ping service

### Frontend Issues

**Problem: Can't fetch data from API**
- **Solution**: 
  - Check `VITE_API_URL` environment variable
  - Verify backend is running and accessible
  - Check browser console for CORS errors

**Problem: White screen after deployment**
- **Solution**: 
  - Check build logs for errors
  - Verify `dist` folder is being published
  - Check for missing dependencies

### ESP32 Issues

**Problem: WiFi won't connect**
- **Solution**: 
  - Double-check SSID and password
  - Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
  - Check WiFi signal strength

**Problem: HTTP POST fails**
- **Solution**: 
  - Verify server URL is correct (HTTPS, not HTTP)
  - Check WiFi connection
  - Increase timeout if needed

**Problem: Inaccurate readings**
- **Solution**: 
  - Calibrate sensor distance
  - Adjust `tankHeight` constant
  - Add averaging for multiple readings

---

## Production Best Practices

### Security
- [ ] Add rate limiting to API
- [ ] Implement API authentication
- [ ] Restrict MongoDB IP whitelist to specific IPs
- [ ] Use HTTPS only
- [ ] Add input validation

### Monitoring
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure uptime monitoring (e.g., UptimeRobot)
- [ ] Set up email alerts for critical events
- [ ] Monitor database usage

### Performance
- [ ] Add Redis caching for current status
- [ ] Implement data pagination
- [ ] Optimize database queries
- [ ] Add CDN for frontend assets

### Maintenance
- [ ] Regular database backups
- [ ] Keep dependencies updated
- [ ] Monitor disk space usage
- [ ] Review logs regularly

---

## Free Tier Limitations

### Render Free Tier
- ✅ 750 hours/month (enough for 24/7 operation)
- ❌ Sleeps after 15 minutes of inactivity
- ❌ ~30 second cold start
- ❌ Limited bandwidth
- **Solution**: Upgrade to paid tier ($7/month) for always-on service

### MongoDB Atlas Free Tier
- ✅ 512 MB storage
- ✅ Shared cluster
- ❌ Limited connections
- **Solution**: Should be sufficient for single-device monitoring

### Workarounds
- Use external ping service to keep Render awake
- Implement data retention policies
- Archive old history data

---

## Cost Estimate (Paid Tiers)

If you need 24/7 uptime:

| Service | Free Tier | Paid Tier | Cost |
|---------|-----------|-----------|------|
| Render Backend | Sleeps | Always on | $7/month |
| Render Frontend | ✅ Free | ✅ Free | $0 |
| MongoDB Atlas | 512MB | 2GB | $9/month |
| **Total** | **$0** | **~$16/month** | for production |

---

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring and alerts
3. ✅ Document your specific sensor calibration
4. ✅ Create backup of your database
5. ✅ Share your project! 🎉

---

## Support

- **GitHub Issues**: For bugs and feature requests
- **Render Docs**: https://render.com/docs
- **MongoDB Docs**: https://docs.atlas.mongodb.com

---

**🎉 Congratulations! Your water level monitoring system is now live!**
