# Deploy CinemaVerse to Fly.io

## Prerequisites

1. **Fly.io Account**: Sign up at https://fly.io
2. **Install flyctl CLI**: https://fly.io/docs/flyctl/install/
3. **Login to flyctl**: Run `fly auth login`
4. **Add billing info**: Required even for free tier

## Deployment Steps

1. **Navigate to your app directory**:
   ```bash
   cd /home/solom/Projects/CinemaVerse/app
   ```

2. **Deploy with Wasp CLI**:
   ```bash
   wasp deploy fly launch cinemaverse-app mia
   ```
   
   Replace `cinemaverse-app` with your preferred app name (must be unique across Fly.io)
   Replace `mia` with your preferred region (see: https://fly.io/docs/reference/regions/)

3. **Set environment variables** (after initial deployment):
   ```bash
   # Required
   wasp deploy fly cmd --context server secrets set TMDB_API_KEY="your_tmdb_api_key"
   
   # Optional but recommended
   wasp deploy fly cmd --context server secrets set OPENROUTER_API_KEY="your_openrouter_key"
   wasp deploy fly cmd --context server secrets set GOOGLE_CLIENT_ID="your_google_client_id"
   wasp deploy fly cmd --context server secrets set GOOGLE_CLIENT_SECRET="your_google_client_secret"
   wasp deploy fly cmd --context server secrets set SENDGRID_API_KEY="your_sendgrid_key"
   ```

4. **Future updates**:
   ```bash
   wasp deploy fly deploy
   ```

## What This Creates

- `cinemaverse-app-client` - Frontend application
- `cinemaverse-app-server` - Backend API server  
- `cinemaverse-app-db` - PostgreSQL database

## Cost Estimate (Updated October 2024)

⚠️ **Important**: Fly.io discontinued free trials for new users as of October 7, 2024

- **Hobby Plan**: $5/month minimum (required for new accounts)
- **Database**: ~$1.94/month for basic PostgreSQL  
- **Total**: ~$7/month for basic deployment

**Note**: Existing free accounts may still work, but new signups require payment.

## Advantages

✅ **Officially supported** by Wasp team
✅ **Automatic database setup** (PostgreSQL)
✅ **Built-in SSL/HTTPS**
✅ **Easy updates** with `wasp deploy fly deploy`
✅ **Full-stack deployment** (client + server + database)
✅ **Environment variable management**
