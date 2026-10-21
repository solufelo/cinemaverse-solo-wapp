# Deploy CinemaVerse to Render (Free Alternative)

## Why Render?
- **Free tier available** (with limitations)
- **PostgreSQL included** in free tier
- **No credit card required** for free tier
- **Good for development/testing**

## Prerequisites
1. **Render Account**: Sign up at https://render.com
2. **GitHub repository**: Push your code to GitHub

## Deployment Steps

### 1. Prepare Your Repository
Add a `render-build.sh` script to your app directory:

```bash
#!/bin/bash
set -e

# Install Wasp CLI
curl -sSL https://get.wasp.sh/installer.sh | sh -s -- -v 0.16.0
export PATH="$HOME/.wasp/bin:$PATH"

# Build the application
wasp build

# Install server dependencies
cd .wasp/build
npm install --production
```

### 2. Create Services on Render

#### A. Create PostgreSQL Database
1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Choose free tier
4. Note the connection details

#### B. Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `chmod +x render-build.sh && ./render-build.sh`
   - **Start Command**: `cd .wasp/build && npm run start:server`
   - **Environment**: Node.js

### 3. Environment Variables
Set in Render dashboard:

```
DATABASE_URL=<your_postgres_connection_string>
TMDB_API_KEY=your_tmdb_api_key
WASP_ENV=production
NODE_ENV=production

# Optional
OPENROUTER_API_KEY=your_openrouter_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Free Tier Details (Updated)

### Render Free Tier Includes:
✅ **Web Service**: 750 hours/month (enough for 1 app)
✅ **PostgreSQL**: 1GB storage, 1 million rows  
✅ **SSL certificates**
✅ **Custom domains**
✅ **Indefinite free tier** (no 30-day expiration)

### Limitations:
❌ **Spins down after 15 minutes** of inactivity
❌ **Cold start delays** (30+ seconds when waking up)
❌ **Limited compute resources**
❌ **90-day expiration** for free PostgreSQL databases

### Portfolio Impact:
- **Good for demos**: Just visit the site 1 minute before showing employers
- **Always works**: No trial expiration, permanent free hosting
- **Professional appearance**: Custom domain support

## Cost for Paid Tier
- **Web Service**: $7/month (always-on)
- **PostgreSQL**: $7/month (persistent)
- **Total**: $14/month

## Advantages
✅ **True free tier** available
✅ **No credit card required** for free tier
✅ **Built-in PostgreSQL**
✅ **GitHub integration**
✅ **Automatic SSL**

## Disadvantages
❌ **Cold starts** on free tier
❌ **Less Wasp-specific support**
❌ **90-day database limit** on free tier
