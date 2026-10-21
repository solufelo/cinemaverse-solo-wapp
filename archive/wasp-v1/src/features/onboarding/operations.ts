import { HttpError } from 'wasp/server';

export interface GuestSession {
  sessionId: string;
  preferences: UserPreferences;
  canExplore: boolean;
  canSearch: boolean;
  canViewDetails: boolean;
  canAddToWatchlist: boolean;
  expiresAt: Date;
  [key: string]: any;
}

export interface UserPreferences {
  favoriteGenres: string[];
  preferredMediaType: 'movie' | 'tv' | 'both';
  watchTime: 'short' | 'medium' | 'long';
  mood: 'action' | 'drama' | 'comedy' | 'thriller' | 'romance' | 'sci-fi' | 'horror' | 'documentary';
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  [key: string]: any;
}

export const createGuestSession = async (args: void, context: any): Promise<GuestSession> => {
  try {
    const sessionId = generateSessionId();
    const preferences = await collectInitialPreferences();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      sessionId,
      preferences,
      canExplore: true,
      canSearch: true,
      canViewDetails: true,
      canAddToWatchlist: false, // Requires signup
      expiresAt
    };
  } catch (error) {
    console.error('Failed to create guest session:', error);
    throw new HttpError(500, 'Failed to create guest session');
  }
};

export const getUserOnboarding = async (args: void, context: any): Promise<OnboardingStep[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  try {
    const onboarding = await context.entities.UserOnboarding.findFirst({
      where: { userId: context.user.id }
    });

    const defaultSteps: OnboardingStep[] = [
      {
        id: 'preferences',
        title: 'Set Your Preferences',
        description: 'Tell us about your favorite genres and viewing habits',
        completed: !!onboarding?.preferences,
        required: true
      },
      {
        id: 'first_search',
        title: 'Search for Content',
        description: 'Find your first movie or TV show',
        completed: false,
        required: false
      },
      {
        id: 'add_to_watchlist',
        title: 'Add to Watchlist',
        description: 'Add your first item to your watchlist',
        completed: false,
        required: false
      },
      {
        id: 'rate_content',
        title: 'Rate Content',
        description: 'Rate a movie or TV show you\'ve watched',
        completed: false,
        required: false
      },
      {
        id: 'explore_recommendations',
        title: 'Explore Recommendations',
        description: 'Check out AI-powered recommendations',
        completed: false,
        required: false
      }
    ];

    // Ensure each step is a plain object with string keys
    return defaultSteps.map(step => ({ ...step }));
  } catch (error) {
    console.error('Failed to get user onboarding:', error);
    throw new HttpError(500, 'Failed to get onboarding steps');
  }
};

export const updateUserOnboarding = async (args: { step: string; completed: boolean; preferences?: UserPreferences }, context: any): Promise<OnboardingStep[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  try {
    const { step, completed, preferences } = args;

    // Update or create onboarding record
    await context.entities.UserOnboarding.upsert({
      where: { userId: context.user.id },
      update: {
        step,
        completed,
        preferences: preferences ? JSON.stringify(preferences) : undefined,
        updatedAt: new Date()
      },
      create: {
        userId: context.user.id,
        step,
        completed,
        preferences: preferences ? JSON.stringify(preferences) : undefined
      }
    });

    // Return updated onboarding steps
    const steps = await getUserOnboarding(undefined, context);
    return steps.map(step => ({ ...step }));
  } catch (error) {
    console.error('Failed to update user onboarding:', error);
    throw new HttpError(500, 'Failed to update onboarding');
  }
};

// Helper functions
function generateSessionId(): string {
  return 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

async function collectInitialPreferences(): Promise<UserPreferences> {
  // For now, return default preferences
  // In a real implementation, this could collect preferences from cookies or local storage
  return {
    favoriteGenres: ['action', 'drama', 'comedy'],
    preferredMediaType: 'both',
    watchTime: 'medium',
    mood: 'action'
  };
} 