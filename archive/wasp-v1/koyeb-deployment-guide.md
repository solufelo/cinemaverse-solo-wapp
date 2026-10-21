# Deploy CinemaVerse to Koyeb (Free Alternative)

## Why Koyeb for Portfolio?

✅ **Permanent free tier** (no trial expiration)
✅ **2.5M execution seconds/month** free
✅ **Always-on option** (no cold starts)
✅ **Global CDN** included
✅ **GitHub integration**
✅ **Professional URLs**

## Free Tier Details

- **Compute**: 2.5M execution seconds/month
- **Memory**: 512MB RAM
- **Storage**: 2.5GB SSD
- **Bandwidth**: 100GB/month
- **Databases**: Need external (use PlanetScale free tier)

## Quick Setup

### 1. Database Setup (PlanetScale - Free)
```bash
# Sign up at https://planetscale.com
# Create database: cinemaverse
# Get connection string
```

### 2. Deploy to Koyeb
1. Go to https://koyeb.com
2. Sign up with GitHub
3. Click "Create App"
4. Select "GitHub repository"
5. Choose your CinemaVerse repo

### 3. Configure Build
```
Build command: curl -sSL https://get.wasp.sh/installer.sh | sh -s -- -v 0.16.0 && export PATH="$HOME/.wasp/bin:$PATH" && wasp build
Run command: cd .wasp/build && npm install && npm run start:server
```

### 4. Environment Variables
```
DATABASE_URL=mysql://your_planetscale_connection
TMDB_API_KEY=your_tmdb_key
WASP_ENV=production
NODE_ENV=production
```

## Advantages
✅ **No cold starts** (with always-on)
✅ **Global performance** (CDN)
✅ **True free tier** (permanent)
✅ **Good for interviews** (always responsive)

## Disadvantages
❌ **No built-in database** (need external)
❌ **Less popular** (newer platform)
❌ **MySQL only** (with PlanetScale)
