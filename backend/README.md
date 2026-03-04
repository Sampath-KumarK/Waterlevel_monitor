# Water Level Monitoring System - Backend

Node.js + Express backend API for ESP32-based water level monitoring.

## 📁 Structure

```
backend/
├── config/
│   └── database.js      # MongoDB connection configuration
├── models/
│   ├── CurrentStatus.js # Current water level model
│   └── History.js       # Event history model
├── routes/
│   ├── waterLevelRoutes.js  # Water level endpoints
│   └── historyRoutes.js     # History endpoints
├── server.js            # Express server entry point
├── package.json
├── .env.example
└── .gitignore
```

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB Atlas account
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URI:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/watermonitor?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

4. Start development server:
```bash
npm run dev
```

Server will run on http://localhost:5000

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```
Returns API status and timestamp.

### Root
```http
GET /
```
Returns API information and available endpoints.

### Water Level Endpoints

#### Get Current Water Level
```http
GET /api/water-level/current
```

**Response:**
```json
{
  "waterLevel": 75,
  "status": "HIGH",
  "updatedAt": "2026-03-03T10:30:00.000Z"
}
```

#### Update Water Level (ESP32)
```http
POST /api/water-level/update
Content-Type: application/json

{
  "deviceId": "ESP32-001",
  "waterLevel": 75,
  "timestamp": "2026-03-03T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "waterLevel": 75,
  "status": "HIGH",
  "historyLogged": false
}
```

**Status Calculation:**
- 0-10% = EMPTY
- 11-40% = LOW
- 41-80% = MEDIUM
- 81-99% = HIGH
- 100% = FULL

**History Logging:**
Only logs events when status changes to FULL or EMPTY.

### History Endpoints

#### Get History
```http
GET /api/history?limit=50
```

**Response:**
```json
{
  "count": 5,
  "history": [
    {
      "_id": "...",
      "event": "FULL",
      "timestamp": "2026-03-03T10:30:00.000Z"
    },
    {
      "_id": "...",
      "event": "EMPTY",
      "timestamp": "2026-03-03T08:15:00.000Z"
    }
  ]
}
```

#### Delete All History (Maintenance)
```http
DELETE /api/history
```

**Response:**
```json
{
  "success": true,
  "message": "Deleted 10 history records"
}
```

## 🗄️ Database Schema

### CurrentStatus Collection
Stores only ONE document with current water level.

```javascript
{
  waterLevel: Number,      // 0-100
  status: String,          // EMPTY|LOW|MEDIUM|HIGH|FULL
  updatedAt: Date         // Auto-updated timestamp
}
```

### History Collection
Logs events only when status reaches FULL or EMPTY.

```javascript
{
  event: String,          // FULL or EMPTY
  timestamp: Date        // Event timestamp
}
```

**Indexes:**
- `timestamp: -1` for fast querying

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |

## 🧪 Testing

### Using curl

**Get current status:**
```bash
curl http://localhost:5000/api/water-level/current
```

**Update water level:**
```bash
curl -X POST http://localhost:5000/api/water-level/update \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ESP32-001",
    "waterLevel": 100
  }'
```

**Get history:**
```bash
curl http://localhost:5000/api/history
```

### Using Postman
1. Import endpoints from documentation
2. Set `Content-Type: application/json` header
3. Add request body for POST endpoints

## 📦 Dependencies

```json
{
  "express": "^4.18.2",      // Web framework
  "mongoose": "^8.0.3",      // MongoDB ODM
  "cors": "^2.8.5",          // CORS middleware
  "dotenv": "^16.3.1"        // Environment variables
}
```

## 🚀 Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete deployment instructions.

**Quick checklist:**
- ✅ MongoDB Atlas cluster created
- ✅ Environment variables set
- ✅ Network access configured (0.0.0.0/0)
- ✅ Build command: `npm install`
- ✅ Start command: `npm start`

## 🐛 Troubleshooting

### MongoDB Connection Issues
```
Error: Could not connect to MongoDB
```
**Solutions:**
- Check `MONGODB_URI` format
- Verify database user credentials
- Ensure IP whitelist includes `0.0.0.0/0`
- Check network connectivity

### Port Already in Use
```
Error: Port 5000 already in use
```
**Solution:**
- Change `PORT` in `.env` file
- Or stop other service using port 5000

### CORS Errors
```
Access-Control-Allow-Origin error
```
**Solution:**
- CORS is enabled for all origins
- Check frontend is making requests to correct URL

## 📊 Logging

Server logs include:
- Request method and path
- MongoDB connection status
- Water level updates
- History events logged
- Errors and exceptions

Sample log output:
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
Server running on port 5000
Environment: development
2026-03-03T10:30:00.000Z - POST /api/water-level/update
History logged: FULL at 2026-03-03T10:30:00.000Z
```

## 🔐 Security Recommendations

For production deployment:
- [ ] Add rate limiting (express-rate-limit)
- [ ] Implement API authentication
- [ ] Validate and sanitize inputs
- [ ] Use helmet for security headers
- [ ] Enable HTTPS only
- [ ] Restrict CORS to specific origins
- [ ] Add request logging
- [ ] Monitor for suspicious activity

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please submit pull requests or open issues.

---

Built with ❤️ for IoT water monitoring
