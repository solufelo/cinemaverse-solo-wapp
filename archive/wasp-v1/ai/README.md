# CinemaVerse Development Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL (or use Wasp's built-in database)
- OpenRouter API key (for AI features)

### Setup
1. **Clone and install dependencies:**
   ```bash
   cd app
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env.server file
   echo "OPENROUTER_API_KEY=your_openrouter_api_key_here" > .env.server
   ```

3. **Start the development server:**
   ```bash
   wasp start
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Project Structure

```
app/
├── src/
│   ├── features/
│   │   ├── search/          # TMDB search functionality
│   │   ├── watchlist/       # Watchlist management
│   │   └── ai/             # AI-powered features
│   ├── shared/
│   │   └── components/     # Reusable UI components
│   └── auth/               # Authentication pages
├── main.wasp              # Wasp configuration
├── schema.prisma          # Database schema
└── ai/                    # Documentation and planning
```

## Key Features

### ✅ Implemented
- **Authentication**: Google OAuth + email/password
- **Search**: TMDB integration for movies and TV shows
- **Watchlist**: Add, remove, and manage content
- **AI Recommendations**: OpenRouter/DeepSeek powered suggestions
- **Rating System**: 1-10 rating with star display

### 🔄 In Progress
- TV episode tracking UI
- Enhanced filtering and sorting
- Content summaries and reviews

### 📋 Planned
- Premium subscription features
- Social features and sharing
- Advanced analytics

## Development Workflow

### Adding New Features
1. **Define operations** in `src/features/{feature}/operations.ts`
2. **Create UI components** in `src/features/{feature}/`
3. **Register in main.wasp** (routes, pages, operations)
4. **Update documentation** in `ai/doc.md`

### Database Changes
1. **Modify schema.prisma**
2. **Run migration**: `wasp db migrate-dev "Description"`
3. **Update operations** to use new schema

### AI Integration
- All AI features use OpenRouter/DeepSeek
- Service abstraction allows easy provider switching
- Fallback mechanisms for reliability

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | Yes (for AI) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes (for Google auth) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes (for Google auth) |

## Common Commands

```bash
# Start development server
wasp start

# Run database migrations
wasp db migrate-dev "Description"

# Reset database
wasp db reset

# Deploy to production
wasp deploy fly launch

# Generate types (if needed)
wasp clean && wasp start
```

## Troubleshooting

### TypeScript Errors
- Restart the Wasp dev server: `wasp start`
- Clear generated files: `wasp clean`

### Database Issues
- Check DATABASE_URL in .env.server
- Run migrations: `wasp db migrate-dev`
- Reset if needed: `wasp db reset`

### AI Features Not Working
- Verify OPENROUTER_API_KEY is set
- Check OpenRouter API status
- Review server logs for errors

## Documentation

- **Current Status**: `ai/doc.md`
- **Phase 2 Planning**: `ai/phase2-plan.md`
- **Architecture**: `ai/plan.md`

## Contributing

1. Follow the established feature folder structure
2. Use TypeScript for all new code
3. Add proper error handling
4. Update documentation for new features
5. Test thoroughly before committing

## Support

For issues or questions:
1. Check the documentation in `ai/`
2. Review Wasp documentation: https://wasp.sh/docs
3. Check server logs for error details 