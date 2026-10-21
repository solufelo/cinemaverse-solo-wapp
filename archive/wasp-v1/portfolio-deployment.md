# CinemaVerse - Portfolio Deployment Guide

## For Employer Showcase 🎯

Quick setup for demonstrating your full-stack Wasp application to potential employers.

## Render Deployment (Recommended for Free Portfolio)

### Why Render for Portfolio?
✅ **Truly free forever** - no trial expiration
✅ **750 hours/month** - more than enough for demos
✅ **Professional URLs** - looks good on resume  
✅ **Easy GitHub integration** - shows your development workflow
✅ **Real PostgreSQL database** - demonstrates full-stack capabilities
⚠️ **15-minute cold starts** - just visit site before interviews

### Quick Setup (5 minutes)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Portfolio deployment ready"
   git push origin main
   ```

2. **Deploy to Render**:
   - Go to https://render.com
   - Sign up with GitHub
   - Click "New" → "Web Service"
   - Connect your CinemaVerse repository

3. **Add PostgreSQL**:
   - Click "New" → "PostgreSQL" 
   - Choose free tier (1GB storage)
   - Copy the connection string

4. **Configure Web Service**:
   - Build Command: `chmod +x render-build.sh && ./render-build.sh`
   - Start Command: `cd .wasp/build && npm run start:server`

5. **Set Environment Variables**:
   ```
   DATABASE_URL=your_postgres_connection_string
   TMDB_API_KEY=your_api_key_here
   WASP_ENV=production
   NODE_ENV=production
   ```

### Demo-Ready Features to Highlight

**What Employers Will See:**
- 🎬 **Movie/TV search** with real TMDB data
- 👤 **User authentication** (Google OAuth + email)
- 📝 **Personal watchlists** with database persistence
- 🤖 **AI recommendations** (if you add OpenRouter key)
- 📱 **Responsive design** works on mobile
- 🔒 **Secure backend** with proper auth

**Tech Stack Showcase:**
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Framework**: Wasp (full-stack)
- **APIs**: TMDB, OpenRouter (AI)
- **Deployment**: Railway/Docker

## Alternative: Render (Also Free)

If Railway doesn't work:
- Go to https://render.com
- Deploy from GitHub (same process)
- **Limitation**: 15-minute cold starts (less ideal for demos)

## Demo Account Setup

Create a demo account for employers to test:
- Email: `demo@cinemaverse.com` 
- Password: `DemoPassword123!`

Or let them sign up with Google (easier).

## Portfolio Presentation Tips

### On Your Resume:
```
CinemaVerse - Full-Stack Movie Tracking Platform
🔗 https://cinemaverse-app.railway.app
📂 https://github.com/yourusername/CinemaVerse

• Built with Wasp framework (React + Node.js + PostgreSQL)
• Integrated TMDB API for real movie/TV data
• Implemented Google OAuth and email authentication
• AI-powered recommendations using OpenRouter API
• Responsive design with Tailwind CSS
```

### In Interviews:
- **Show the live site** - always impressive
- **Walk through features** - search, watchlist, auth
- **Explain architecture** - full-stack, database design
- **Discuss challenges** - API integration, auth flow
- **Highlight deployment** - shows DevOps knowledge

## Cost: $0/month Forever

Render's free tier includes:
- Web service: 750 hours/month (enough for 1 app)
- PostgreSQL: 1GB storage, 1M rows
- SSL certificates and custom domains
- **Total**: Completely free (no trial expiration)

## Demo Tips for Interviews

**Before showing employers:**
1. Visit your site 1-2 minutes before the demo (to wake it up)
2. Keep a browser tab open during the interview
3. This eliminates the cold start delay

**Professional presentation:**
- "I deployed this full-stack app to Render's cloud platform"
- "It uses PostgreSQL for data persistence"
- "The architecture demonstrates scalable deployment practices"
