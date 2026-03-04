# 🚀 Quick Start Guide for Render Deployment

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)
```bash
cd final
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 1.2 Create .env file (DO NOT COMMIT)
Copy `.env.example` to `.env` and fill in real values:
```bash
cp backend/.env.example backend/.env
```

**backend/.env file:**
```env
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/watermonitor?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.onrender.com
```

### 1.3 Test Locally
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Start backend
cd backend && npm run dev

# Start frontend (in another terminal)
npm run dev
```

### 1.4 Check Git Status
```bash
git status
# Should NOT show node_modules/, .env, or dist/
# Should show only source files
```

## Step 2: Push to GitHub

```bash
git add .
git commit -m "feat: Water Level Monitoring System - Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 3: Deploy Backend on Render

1. Go to [render.com](https://render.com) → Sign Up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Fill in details:
   - **Name:** `water-level-backend`
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Instance Type:** Free (recommended for testing)

5. Click "Advanced" and add Environment Variables:
   ```
   MONGODB_URI = <your MongoDB connection string>
   NODE_ENV = production
   CORS_ORIGIN = https://your-frontend-url.onrender.com  # Will update after frontend deployed
   ```

6. Click "Create Web Service"
7. Wait for deployment to complete (2-3 minutes)
8. Copy your backend URL (e.g., https://water-level-backend.onrender.com)

## Step 4: Deploy Frontend on Render

1. Click "New +" → "Static Site"
2. Connect same GitHub repository
3. Fill in details:
   - **Name:** `water-level-frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. Click "Advanced" and add Environment Variables:
   ```
   VITE_API_URL = https://water-level-backend.onrender.com/api
   ```

5. Click "Create Static Site"
6. Wait for deployment (2-3 minutes)

## Step 5: Update Backend CORS

1. Go back to Backend Web Service settings
2. Update `CORS_ORIGIN` environment variable:
   ```
   https://water-level-frontend.onrender.com
   ```
3. Service will auto-redeploy

## Step 6: Test Everything

### Frontend
- Open https://your-frontend-url.onrender.com
- Should load without errors

### Backend Health Check
```bash
curl https://your-backend-url/api/health
# Response: {"status":"OK","message":"...","timestamp":"..."}
```

### Current Water Level
```bash
curl https://your-backend-url/api/water-level/current
```

## Step 7: Configure ESP32

Copy the backend URL and update your Arduino sketch:

```cpp
const char* SERVER_URL = "https://your-backend-url/api/water-level/update";
```

Upload the updated sketch to ESP32.

## Troubleshooting

### Backend not connecting to MongoDB
- Check MONGODB_URI is correct
- Ensure IP address is whitelisted in MongoDB Atlas (0.0.0.0/0)
- Check NODE_ENV is set to 'production'

### Frontend shows "Cannot reach API"
- Check VITE_API_URL environment variable
- Verify backend URL is correct
- Check CORS_ORIGIN matches frontend URL

### ESP32 connection refuses
- Verify backend is running
- Check SERVER_URL in Arduino sketch
- Ensure WiFi credentials are correct in sketch

### Render free tier sleeping
- Free tier services sleep after 15 min of no activity
- First request takes ~30 seconds
- Upgrade to paid tier for always-on service

---

**✅ All Set!** Your Water Level Monitoring System is now live on Render!
