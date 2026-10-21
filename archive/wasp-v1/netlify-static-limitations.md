# Netlify Static Deployment - Why It Won't Work

## Current Issues

Your Wasp application cannot be deployed as a static site to Netlify because:

### 1. **Server-Side Dependencies**
- Database operations (Prisma queries)
- Authentication (email/password, Google OAuth)
- API routes and operations
- Server-side rendering requirements

### 2. **Missing Backend**
All these features require a backend server:
- User authentication and sessions
- Database queries (watchlist, recommendations, etc.)
- AI operations (OpenRouter API calls)
- TMDB API proxying
- Payment processing (Stripe webhooks)

### 3. **Wasp Architecture**
Wasp generates:
- **Client**: React SPA (can be static)
- **Server**: Node.js/Express API (needs hosting)
- **Database**: PostgreSQL (needs hosting)

## What Would Break on Static Deployment

❌ **Authentication**: No login/signup functionality
❌ **Watchlist**: Can't save/retrieve user data
❌ **Recommendations**: No AI-powered features
❌ **Search**: Limited to client-side only
❌ **User accounts**: No user management
❌ **Database**: No data persistence

## Theoretical Static Workaround (Not Recommended)

If you absolutely must use Netlify, you'd need to:

1. **Remove all Wasp operations** (queries/actions)
2. **Remove authentication** 
3. **Use external APIs** directly from client
4. **Use local storage** instead of database
5. **Remove server-dependent features**

This would essentially mean rebuilding as a different application.

## Recommendation

**Use Fly.io or Railway instead** - they support full-stack applications and are designed for Wasp deployments.
