# ✅ Deployment Checklist - Use This!

## Before Push to GitHub

- [ ] **Verify .env Security**
  - Run: `git status` and ensure `backend/.env` is NOT listed
  - Run: `git ls-files | grep ".env"` should show only `.env.example` files

- [ ] **Check for Secrets in Code**
  - Run: `grep -r "mongodb+srv" --include="*.js" --include="*.jsx"` 
  - Should return 0 results

- [ ] **Verify Dependencies**
  - Run: `npm list` (should work without errors)
  - Run: `cd backend && npm list` (should work without errors)

- [ ] **Test Locally**
  ```bash
  # Terminal 1 - Backend
  cd backend
  npm run dev
  
  # Terminal 2 - Frontend  
  npm run dev
  
  # Should see no errors, URLs should be accessible
  ```

## Push to GitHub Commands

```bash
cd final

# Initialize if needed
git init
git config user.name "Your Name"
git config user.email "your@email.com"

# Commit and push
git add .
git commit -m "feat: Water Level Monitoring System - Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

- [ ] GitHub repository created
- [ ] Code successfully pushed to main branch
- [ ] All files visible on GitHub (except node_modules and .env)

## Deploy Backend to Render

**https://render.com/docs/deploy-node-express-app**

- [ ] Render account created
- [ ] Web Service created for backend
  - Name: `water-level-backend`
  - Build: `cd backend && npm install`
  - Start: `cd backend && npm start`
- [ ] Environment variables added:
  - [ ] `MONGODB_URI` = Your MongoDB connection string
  - [ ] `NODE_ENV` = `production`
  - [ ] `CORS_ORIGIN` = (will be set after frontend deployed)
- [ ] Backend deployed successfully
- [ ] Backend URL copied: `_______________________`
- [ ] Health check works: `curl https://[backend-url]/api/health`

## Deploy Frontend to Render

**https://render.com/docs/deploy-create-react-app**

- [ ] Static Site created for frontend
  - Name: `water-level-frontend`
  - Build: `npm install && npm run build`
  - Publish: `dist`
- [ ] Environment variables added:
  - [ ] `VITE_API_URL` = `https://[backend-url]/api`
- [ ] Frontend deployed successfully
- [ ] Frontend URL copied: `_______________________`
- [ ] Frontend loads in browser without errors

## Link Services

- [ ] Go back to Backend service
- [ ] Update `CORS_ORIGIN` = `https://[frontend-url]`
- [ ] Wait for redeployment (~2 minutes)
- [ ] Test API from frontend - should work

## Configure ESP32

- [ ] Update Arduino sketch SERVER_URL:
  ```cpp
  const char* SERVER_URL = "https://[backend-url]/api/water-level/update";
  ```
- [ ] Upload sketch to ESP32
- [ ] Check Serial Monitor for successful posts

## Final Verification

- [ ] Frontend loads: https://[frontend-url]
- [ ] Water level updates in real-time
- [ ] History is recorded
- [ ] Alerts trigger when FULL/EMPTY
- [ ] Backend health: https://[backend-url]/api/health
- [ ] Database receiving data in MongoDB Atlas

## 🎉 Complete!

Your Water Level Monitoring System is now live on Render!

---

**Deployment URLs:**
- Frontend: `_______________________`
- Backend: `_______________________`
- MongoDB: Connected ✅
- ESP32: Connected ✅
