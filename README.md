# Disaster Response and Volunteer Coordination Platform

A complete, production-ready disaster response platform featuring emergency reporting, SOS alerts, volunteer dispatch and task tracking, admin coordinator dashboards, real-time notifications, chat assistance, and donor contribution processing.

---

## 🚀 Quick Deployment Guide

### Option 1: Full-Stack on Render (Simplest - 1 Step)
Because the Express backend now serves both APIs and frontend static files:
1. Push this project to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), click **New +** -> **Web Service**.
3. Connect your repository.
4. Set:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `MONGODB_URL`: Your MongoDB Atlas connection string (e.g. `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/disaster_db`)
   - `PORT`: `10000` (Render default)
6. Click **Deploy Web Service**. Render serves both the homepage (`first.html`) and all `/api/*` routes.

---

### Option 2: Render (Backend) + Netlify (Frontend)

#### Step A: Deploy Backend on Render
1. Follow Option 1 steps to create your Render Web Service.
2. Once deployed, copy your live backend URL (e.g., `https://disaster-response-backend.onrender.com`).

#### Step B: Deploy Frontend on Netlify
Choose either method:
- **Method 1 (Netlify Proxy - Recommended)**:
  1. Open `netlify.toml` and `_redirects`.
  2. Replace `YOUR_BACKEND_URL.onrender.com` with your Render domain:
     ```toml
     [[redirects]]
       from = "/api/*"
       to = "https://your-service.onrender.com/api/:splat"
       status = 200
       force = true
     ```
  3. Drag and drop the project folder or connect via Git in [Netlify](https://app.netlify.com/).
- **Method 2 (Zero-code URL parameter)**:
  1. Deploy directly to Netlify.
  2. Open your Netlify site with your backend parameter once:
     `https://your-site.netlify.app/?backend=https://your-service.onrender.com`
  3. `api-config.js` automatically saves and routes all future API requests to your Render backend!

---

## 🔑 Essential Environment Variables

| Variable | Required For | Description / Example |
| :--- | :--- | :--- |
| `MONGODB_URL` | Render / Backend | Your MongoDB Atlas connection string (`mongodb+srv://user:pass@cluster0.xxx.mongodb.net/disaster_db?retryWrites=true&w=majority`) |
| `PORT` | Local / Render | Server port (Render sets this automatically to `10000`; defaults to `3000` locally) |

---

## 💻 Local Development
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string

# 3. Start server
npm start

# 4. Open browser
http://localhost:3000
```

---

## 📁 Key File Structure
- `first.html`: Homepage / Landing entry point with "GO" button
- `login.html`: Unified role-based authentication (Admin, Volunteer, Emergency User, Donor)
- `admin.html`: Coordinator dashboard, emergency approvals, volunteer assignment, donation analytics
- `volunteer.html`: Volunteer profile management, skills, status toggle
- `task.html`: Active task list, task acceptance, interactive map, emergency dispatch chat
- `emergency.html`: SOS panic alerts, emergency incident reporting, volunteer finder
- `donor.html`: Relief fund contribution processing with instant receipt confirmation
- `server.js`: Production Node.js / Express backend with CORS, MongoDB Atlas, and 0.0.0.0 binding
- `api-config.js`: Dynamic frontend-to-backend API routing bridge
- `netlify.toml` & `_redirects`: Netlify routing and backend proxy configuration
- `render.yaml`: Render Blueprint configuration
