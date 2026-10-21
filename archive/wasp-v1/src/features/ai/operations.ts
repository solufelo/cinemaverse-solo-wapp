import { HttpError } from 'wasp/server'
import type { GetRecommendations, GenerateSummary, GenerateReview } from 'wasp/server/operations'
import type { WatchItem, User } from 'wasp/entities'

// OpenRouter/DeepSeek API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const DEEPSEEK_MODEL = 'deepseek/deepseek-coder' // Using DeepSeek model via OpenRouter

interface OpenRouterRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage: {
    total_tokens: number
    prompt_tokens: number
    completion_tokens: number
  }
}

// AI Service class for handling OpenRouter/DeepSeek interactions
class AIService {
  private async callOpenRouter(prompt: string, systemMessage?: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      // Return fallback response when AI is not available
      return 'AI features are not available. Please configure OpenRouter API key for personalized recommendations.'
    }

    const messages = [
      ...(systemMessage ? [{ role: 'system' as const, content: systemMessage }] : []),
      { role: 'user' as const, content: prompt }
    ]

    const requestBody: OpenRouterRequest = {
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 500
    }

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cinemaverse.app',
          'X-Title': 'CinemaVerse'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('OpenRouter API error:', errorData)
        throw new HttpError(500, 'Failed to generate AI response')
      }

      const data: OpenRouterResponse = await response.json()
      return data.choices[0]?.message?.content || 'No response generated'
    } catch (error) {
      console.error('OpenRouter API call failed:', error)
      throw new HttpError(500, 'AI service temporarily unavailable')
    }
  }

  async generateRecommendations(userId: string, watchlist: WatchItem[]): Promise<string[]> {
    if (!OPENROUTER_API_KEY) {
      // Return fallback recommendations when AI is not available
      return [
        'Based on your watchlist, try exploring similar genres',
        'Check out trending movies in your favorite categories',
        'Look for films by directors you enjoy',
        'Explore award-winning films in your preferred genres',
        'Try international films from countries you like'
      ]
    }

    const systemMessage = `You are a movie and TV show recommendation expert. Based on the user's watchlist, suggest 5 movies or TV shows they might enjoy. Focus on variety and include both popular and hidden gems. Return only the titles, one per line.`

    const watchlistSummary = watchlist
      .map(item => `${item.title} (${item.mediaType}) - Rating: ${item.rating || 'Not rated'}`)
      .join('\n')

    const prompt = `User's watchlist:\n${watchlistSummary}\n\nBased on this watchlist, suggest 5 movies or TV shows the user might enjoy:`

    const response = await this.callOpenRouter(prompt, systemMessage)
    return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5)
  }

  async generateSummary(title: string, overview: string, mediaType: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      // Return the original overview when AI is not available
      return overview || `A ${mediaType.toLowerCase()} that promises an engaging viewing experience.`
    }

    const systemMessage = `You are a movie and TV show critic. Create a concise, engaging summary (2-3 sentences) that captures the essence of the content without spoilers. Make it appealing to potential viewers.`

    const prompt = `Create a brief, engaging summary for this ${mediaType.toLowerCase()}:\nTitle: ${title}\nOverview: ${overview}`

    return await this.callOpenRouter(prompt, systemMessage)
  }

  async generateReview(title: string, rating: number, userThoughts?: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      // Return fallback review when AI is not available
      const ratingText = rating >= 8 ? 'excellent' : rating >= 6 ? 'good' : rating >= 4 ? 'decent' : 'disappointing'
      return `This ${ratingText} film deserves a ${rating}/10 rating. ${userThoughts || 'A solid viewing experience worth checking out.'}`
    }

    const systemMessage = `You are a movie and TV show reviewer. Write a brief, personal review (2-3 sentences) based on the user's rating and thoughts. Make it sound natural and conversational.`

    const prompt = `Write a brief review for "${title}" with a rating of ${rating}/10${userThoughts ? ` and these thoughts: ${userThoughts}` : ''}:`

    return await this.callOpenRouter(prompt, systemMessage)
  }
}

const aiService = new AIService()

// Wasp Operations
export const getRecommendations: GetRecommendations<void, { recommendations: string[] }> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  try {
    // Get user's watchlist
    const watchlist = await context.entities.WatchItem.findMany({
      where: { userId: context.user.id },
      orderBy: { createdAt: 'desc' }
    })

    if (watchlist.length === 0) {
      // Return popular recommendations for new users
      return {
        recommendations: [
          'Breaking Bad',
          'The Shawshank Redemption',
          'Stranger Things',
          'Inception',
          'The Office'
        ]
      }
    }

    const recommendations = await aiService.generateRecommendations(context.user.id, watchlist)
    return { recommendations }
  } catch (error) {
    console.error('Failed to generate recommendations:', error)
    // Return fallback recommendations
    return {
      recommendations: [
        'Breaking Bad',
        'The Shawshank Redemption',
        'Stranger Things',
        'Inception',
        'The Office'
      ]
    }
  }
}

export const generateSummary: GenerateSummary<{
  title: string
  overview: string
  mediaType: string
}, { summary: string }> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { title, overview, mediaType } = args

  try {
    const summary = await aiService.generateSummary(title, overview, mediaType)
    return { summary }
  } catch (error) {
    console.error('Failed to generate summary:', error)
    // Return a simple fallback summary
    return {
      summary: `A compelling ${mediaType.toLowerCase()} that offers an engaging story and memorable characters.`
    }
  }
}

export const generateReview: GenerateReview<{
  title: string
  rating: number
  userThoughts?: string
}, { review: string }> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { title, rating, userThoughts } = args

  try {
    const review = await aiService.generateReview(title, rating, userThoughts)
    return { review }
  } catch (error) {
    console.error('Failed to generate review:', error)
    // Return a simple fallback review
    return {
      review: `This ${rating >= 7 ? 'excellent' : rating >= 5 ? 'decent' : 'disappointing'} title offers ${rating >= 7 ? 'outstanding' : rating >= 5 ? 'enjoyable' : 'limited'} entertainment value.`
    }
  }
} 