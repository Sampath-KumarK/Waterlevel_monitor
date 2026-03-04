# 💧 Water Level Monitoring System

A complete full-stack IoT water level monitoring web application for ESP32 devices.

## 🚀 Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (Free Tier)
- **Deployment**: Render (Free)

## 📋 Features

### ESP32 Integration
- Sends data every 30 seconds with deviceId, waterLevel (0-100%), and timestamp
- Automatic status calculation based on water level

### Backend Features
- Single current status document (upserted on each update)
- Automatic tank status calculation:
  - 0-10% = EMPTY
  - 11-40% = LOW
  - 41-80% = MEDIUM
  - 81-99% = HIGH
  - 100% = FULL
- History logging only for FULL or EMPTY events
- RESTful API endpoints

### Frontend Features
- Large circular water level gauge (0-100%)
- Real-time status display with color coding
- Red alert banner when tank is FULL
- History table showing FULL/EMPTY events
- Auto-refresh every 10 seconds
- Fully responsive mobile design
- Clean, modern UI

## 📁 Project Structure

```
final/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── CurrentStatus.js     # Current status schema
│   │   └── History.js           # History schema
│   ├── routes/
│   │   ├── waterLevelRoutes.js  # Water level endpoints
│   │   └── historyRoutes.js     # History endpoints
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env.example
├── src/
│   ├── components/
│   │   ├── WaterGauge.jsx       # Circular gauge component
│   │   ├── WaterGauge.css
│   │   ├── AlertBanner.jsx      # Full alert banner
│   │   ├── AlertBanner.css
│   │   ├── HistoryTable.jsx     # Event history table
│   │   └── HistoryTable.css
│   ├── services/
│   │   └── api.js               # API service layer
│   ├── App.jsx                  # Main app component
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free tier)
- Git

### 1. Clone the Repository
```bash
cd final
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/watermonitor?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

### 3. Frontend Setup

```bash
# From final/ directory
npm install
```

Create `.env` file in `final/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
# From final/ directory
npm run dev
```

Open http://localhost:5173 in your browser.

## 🌐 API Endpoints

### Water Level
- `GET /api/water-level/current` - Get current water level
- `POST /api/water-level/update` - Update water level (ESP32)
  ```json
  {
    "deviceId": "ESP32-001",
    "waterLevel": 75,
    "timestamp": "2026-03-03T10:30:00Z"
  }
  ```

### History
- `GET /api/history?limit=50` - Get event history

### Health Check
- `GET /api/health` - API health status

## 📊 Database Schema

### CurrentStatus Collection
```javascript
{
  waterLevel: Number (0-100),
  status: String (EMPTY|LOW|MEDIUM|HIGH|FULL),
  updatedAt: Date
}
```

### History Collection
```javascript
{
  event: String (FULL|EMPTY),
  timestamp: Date
}
```

## 🚀 Deployment to Render (Free)

### Deploy Backend

1. **Create MongoDB Atlas Database** (if not already done)
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free cluster
   - Get connection string
   - Whitelist IP: `0.0.0.0/0` (for Render access)

2. **Deploy to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `water-monitor-api`
     - **Root Directory**: `final/backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Add Environment Variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `NODE_ENV`: `production`
     - `PORT`: `5000`
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy the service URL (e.g., `https://water-monitor-api.onrender.com`)

### Deploy Frontend

1. **Update API URL**
   - Create `.env.production` file in `final/`:
   ```env
   VITE_API_URL=https://water-monitor-api.onrender.com/api
   ```

2. **Deploy to Render**
   - Go to Render Dashboard
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `water-monitor-app`
     - **Root Directory**: `final`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
   - Add Environment Variable:
     - `VITE_API_URL`: `https://water-monitor-api.onrender.com/api`
   - Click "Create Static Site"
   - Wait for deployment
   - Your app will be live at `https://water-monitor-app.onrender.com`

## 📱 ESP32 Integration

### Arduino Code Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://water-monitor-api.onrender.com/api/water-level/update";

const int trigPin = 5;
const int echoPin = 18;
const int tankHeight = 200; // cm

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  int waterLevel = measureWaterLevel();
  sendData(waterLevel);
  delay(30000); // 30 seconds
}

int measureWaterLevel() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH);
  int distance = duration * 0.034 / 2;
  int waterLevel = map(distance, tankHeight, 0, 0, 100);
  waterLevel = constrain(waterLevel, 0, 100);
  
  return waterLevel;
}

void sendData(int waterLevel) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<200> doc;
    doc["deviceId"] = "ESP32-001";
    doc["waterLevel"] = waterLevel;
    doc["timestamp"] = ""; // Server will use current time if empty
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode > 0) {
      Serial.printf("Data sent successfully. Code: %d\n", httpResponseCode);
    } else {
      Serial.printf("Error sending data. Code: %d\n", httpResponseCode);
    }
    
    http.end();
  }
}
```

### Required Libraries
```
WiFi (built-in)
HTTPClient (built-in)
ArduinoJson (install via Library Manager)
```

## 🔍 Testing

### Test Backend API
```bash
# Get current status
curl http://localhost:5000/api/water-level/current

# Update water level
curl -X POST http://localhost:5000/api/water-level/update \
  -H "Content-Type: "application/json" \
  -d '{"deviceId":"ESP32-001","waterLevel":85}'

# Get history
curl http://localhost:5000/api/history
```

## 🐛 Troubleshooting

### Backend Issues
- **MongoDB connection fails**: Check connection string and IP whitelist
- **Port already in use**: Change PORT in `.env` file
- **CORS errors**: Verify frontend URL is allowed

### Frontend Issues
- **API calls fail**: Check `VITE_API_URL` in `.env`
- **Data not updating**: Verify backend is running
- **Build fails**: Run `npm install` again

### Render Deployment
- **Build fails**: Check build logs, verify `package.json` scripts
- **503 errors**: Wait for service to start (cold start on free tier)
- **Environment variables missing**: Double-check all required vars

## 📈 Free Tier Limitations

- **Render Free**: Service sleeps after 15 min inactivity (cold start ~30s)
- **MongoDB Atlas Free**: 512MB storage, shared cluster
- **Solution**: Consider paid tiers for production use

## 🔐 Security Notes

- Never commit `.env` files
- Use environment variables for sensitive data
- Implement rate limiting for production
- Add authentication for admin endpoints

## 📄 License

MIT License - feel free to use this project for learning or production!

## 🤝 Contributing

Pull requests welcome! Please follow existing code style.

## 📧 Support

For issues or questions, please create a GitHub issue.

---

Built with ❤️ for IoT water monitoring
