# GitHub & Render Deployment Checklist

Before pushing to GitHub and deploying to Render, make sure everything is ready:

## Pre-Push to GitHub ✅

- [ ] **Environment Variables Secured**
  - [ ] No `.env` file is visible in git status (should be in .gitignore)
  - [ ] `.env.example` exists with placeholder values only
  - [ ] All sensitive data removed from example files

- [ ] **Dependencies Cleaned**
  - [ ] `node_modules/` is in .gitignore
  - [ ] `package-lock.json` files are committed (not ignored)
  - [ ] Backend and frontend both have `package.json`

- [ ] **Code Quality**
  - [ ] No debugging console.log statements left
  - [ ] Code follows project style (ESLint passes)
  - [ ] All commented-out code removed

- [ ] **Documentation Updated**
  - [ ] README.md is current and accurate
  - [ ] DEPLOYMENT.md has Render instructions
  - [ ] QUICKSTART.md works as documented

- [ ] **Git Initial Setup**
  ```bash
  cd final
  git init
  git config user.name "Your Name"
  git config user.email "your.email@example.com"
  git add .
  git commit -m "Initial commit: Water Level Monitoring System"
  git branch -M main
  git remote add origin https://github.com/yourusername/your-repo.git
  git push -u origin main
  ```

## Render Deployment Steps 🚀

### Backend Deployment
1. Go to [render.com](https://render.com) and sign up
2. Create new Web Service
3. Connect your GitHub repository
4. Configuration:
   - Name: `water-level-backend`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment Variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `NODE_ENV`: `production`
     - `CORS_ORIGIN`: Your frontend URL (will update after frontend is deployed)

### Frontend Deployment
1. Create new Static Site
2. Connect same repository
3. Configuration:
   - Name: `water-level-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment Variables:
     - `VITE_API_URL`: Your backend Render URL

### Update Backend CORS
After frontend is deployed, update backend environment variable:
- `CORS_ORIGIN` = Your frontend Render URL

## ESP32 Configuration 📱

Update the Arduino sketch with your backend URL:
```cpp
const char* SERVER_URL = "https://your-backend-url/api/water-level/update";
```

## Verification ✅

- [ ] Frontend loads successfully
- [ ] Backend API health check: `https://your-backend-url/api/health`
- [ ] ESP32 can reach backend and send data
- [ ] Frontend receives and displays water level
- [ ] History is being collected
- [ ] Alerts trigger when water is FULL or EMPTY

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
