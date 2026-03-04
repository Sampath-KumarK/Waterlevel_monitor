# 🎯 Quick Start Guide

Get your Water Level Monitoring System running in 10 minutes!

## ⚡ Quick Setup

### 1. Backend Setup (5 minutes)

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file with your MongoDB URI
# (Get free MongoDB URI from https://mongodb.com/cloud/atlas)
```

**Edit .env:**
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/watermonitor
PORT=5000
NODE_ENV=development
```

```bash
# Start backend server
npm run dev
```

✅ Backend running at http://localhost:5000

---

### 2. Frontend Setup (3 minutes)

Open a **new terminal** in the `final/` directory:

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

**Edit .env:**
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
# Start frontend
npm run dev
```

✅ Frontend running at http://localhost:5173

---

### 3. Test the System (2 minutes)

Open a **new terminal** and test the API:

```bash
# Test 1: Health check
curl http://localhost:5000/api/health

# Test 2: Get current status
curl http://localhost:5000/api/water-level/current

# Test 3: Update water level to 50%
curl -X POST http://localhost:5000/api/water-level/update \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"ESP32-001\",\"waterLevel\":50}"

# Test 4: Trigger FULL alert (100%)
curl -X POST http://localhost:5000/api/water-level/update \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"ESP32-001\",\"waterLevel\":100}"

# Test 5: Trigger EMPTY event (0%)
curl -X POST http://localhost:5000/api/water-level/update \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"ESP32-001\",\"waterLevel\":0}"

# Test 6: Check history
curl http://localhost:5000/api/history
```

**Refresh your browser** - you should see:
- ✅ Water gauge showing 0%
- ✅ Status showing "EMPTY"
- ✅ History table showing FULL and EMPTY events

---

## 🎨 What You'll See

### Home Page
- **Large circular gauge** showing water level (0-100%)
- **Status indicator** with color coding:
  - 🔴 Red = EMPTY (0-10%)
  - 🟠 Orange = LOW (11-40%)
  - 🔵 Blue = MEDIUM (41-80%)
  - 🟢 Green = HIGH (81-99%)
  - 🟢 Dark Green = FULL (100%)
- **Red alert banner** when tank is FULL
- **Auto-refresh** every 10 seconds

### History Table
- Shows only FULL and EMPTY events
- Displays event type, date, and time
- Color-coded badges (Red for FULL, Gray for EMPTY)

---

## 📱 Test Different Scenarios

### Scenario 1: Normal Operation
```bash
# 50% - Medium
curl -X POST http://localhost:5000/api/water-level/update \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"ESP32-001\",\"waterLevel\":50}"
```
**Expected:** Blue gauge, "MEDIUM" status, no alert

### Scenario 2: Low Water
```bash
# 25% - Low
curl -X POST http://localhost:5000/api/water-level/update \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"ESP32-001\",\"waterLevel\":25}"
```
**Expected:** Orange gauge, "LOW" status

### Scenario 3: Full Tank (Alert!)
```bash
# 100% - Full
curl -X POST http://localhost:5000/api/water-level/update \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"ESP32-001\",\"waterLevel\":100}"
```
**Expected:** Green gauge, "FULL" status, **RED ALERT BANNER**, logged to history

### Scenario 4: Empty Tank
```bash
# 0% - Empty
curl -X POST http://localhost:5000/api/water-level/update \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"ESP32-001\",\"waterLevel\":0}"
```
**Expected:** Red gauge, "EMPTY" status, logged to history

---

## 🔧 ESP32 Quick Setup

### Hardware You Need
- ESP32 development board (~$5)
- HC-SR04 ultrasonic sensor (~$2)
- 4 jumper wires
- USB cable
- Water tank for testing

### Wiring
```
HC-SR04  →  ESP32
VCC      →  5V
GND      →  GND
TRIG     →  GPIO 5
ECHO     →  GPIO 18
```

### Software
1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add ESP32 board support
3. Install `ArduinoJson` library
4. Open `ESP32_WaterLevel.ino`
5. Update WiFi credentials and server URL
6. Upload to ESP32

**Done!** ESP32 will send data every 30 seconds.

---

## 🚀 Deploy to Production

Ready to deploy? Follow the complete guide:

👉 See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step deployment to:
- **MongoDB Atlas** (free)
- **Render Backend** (free)
- **Render Frontend** (free)

Total time: ~30 minutes
Total cost: **$0** (free tier)

---

## 🐛 Common Issues

### "Cannot connect to MongoDB"
✅ **Solution:** 
- Check your MongoDB URI in `.env`
- Make sure you created a database user
- Whitelist IP address `0.0.0.0/0` in MongoDB Atlas

### "CORS error"
✅ **Solution:** 
- CORS is enabled by default
- Check that `VITE_API_URL` points to correct backend URL

### "Port 5000 already in use"
✅ **Solution:** 
- Change `PORT=5001` in backend `.env`
- Update frontend `.env` to match

### "Module not found"
✅ **Solution:** 
```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

---

## 📚 Learning Resources

### Understand the Code
- **Backend:** Check `backend/README.md`
- **API Docs:** See API endpoints section
- **Frontend:** React + Vite with modern hooks

### Next Steps
1. ✅ Customize the UI colors
2. ✅ Add email notifications
3. ✅ Add multiple tank support
4. ✅ Add data visualization charts
5. ✅ Deploy to production

---

## 🎉 Success Checklist

- [ ] Backend running at http://localhost:5000
- [ ] Frontend running at http://localhost:5173
- [ ] Can see water gauge
- [ ] Can update water level via API
- [ ] History table shows events
- [ ] Full alert banner appears at 100%
- [ ] Auto-refresh works (wait 10 seconds)
- [ ] MongoDB storing data
- [ ] ESP32 connected and sending data (if available)

---

## 💡 Pro Tips

### Keep Backend Alive (Free Tier)
Free Render backend sleeps after 15 min. Solutions:
- Use [UptimeRobot](https://uptimerobot.com) to ping every 5 min
- Upgrade to paid tier ($7/month) for 24/7 uptime

### Calibrate Sensor
Adjust in ESP32 code:
```cpp
const int tankHeight = 200;  // Your tank height in cm
const int sensorOffset = 10; // Distance from sensor to top
```

### Add More Features
- Email alerts on FULL/EMPTY
- SMS notifications (Twilio)
- Data export to CSV
- Weekly/monthly reports
- Multiple device support

---

## 🤝 Need Help?

- **Issues?** Check troubleshooting sections
- **Questions?** Open a GitHub issue
- **Ideas?** Submit a pull request!

---

**Happy monitoring! 💧**

Built with ❤️ for IoT enthusiasts
