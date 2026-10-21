# CinemaVerse Deployment Guide

## Netlify Deployment

This Wasp application is configured for deployment on Netlify.

### Build Process

1. **Wasp CLI Installation**: The build script automatically installs Wasp CLI if not present
2. **Dependencies**: Installs Node.js dependencies via `npm install`
3. **Wasp Build**: Runs `wasp build` to generate the client-side application
4. **Output**: The built application is available in `.wasp/build/web-app/dist`

### Netlify Configuration

The `netlify.toml` file contains:
- Build command: `./build.sh`
- Publish directory: `.wasp/build/web-app/dist`
- Node.js version: 20
- SPA redirect rules for client-side routing
- Next.js plugin disabled for Wasp applications

### Environment Variables

Make sure to set these environment variables in your Netlify dashboard:

**Required:**
- `DATABASE_URL`: Your production database connection string
- `TMDB_API_KEY`: The Movie Database API key (required for movie/TV data)

**Optional (for enhanced features):**
- `OPENROUTER_API_KEY`: OpenRouter API key for AI-powered recommendations and summaries
- `SENDGRID_API_KEY`: SendGrid API key for email functionality
- `ADMIN_EMAILS`: Comma-separated list of admin email addresses

**Note:** The application will work with just the required variables. AI features will show fallback content when OpenRouter API key is not provided.

### Database Setup

1. Set up a production database (PostgreSQL recommended)
2. Run migrations: `wasp db migrate-dev`
3. Set the `DATABASE_URL` environment variable

### Build Script

The `build.sh` script handles:
- Wasp CLI installation
- Dependency installation
- Wasp application building
- Error handling and logging

### Troubleshooting

If the build fails:
1. Check that all environment variables are set
2. Verify the database connection
3. Check the build logs for specific error messages
4. Ensure the Wasp CLI installation completed successfully
