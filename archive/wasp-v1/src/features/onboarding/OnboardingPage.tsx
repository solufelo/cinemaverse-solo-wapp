import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from 'wasp/client/auth';
import { useNavigate } from 'react-router-dom';
import { updateUserOnboarding } from 'wasp/client/operations';
import PreferenceQuiz, { UserPreferences } from '../../shared/components/PreferenceQuiz';
import { Button } from '../../components/ui/button';
import { CheckCircle, Star, Users, Film } from 'lucide-react';

export default function OnboardingPage() {
  const { data: user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'quiz' | 'complete'>('welcome');
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const handleQuizComplete = async (userPreferences: UserPreferences) => {
    setPreferences(userPreferences);
    
    try {
      await updateUserOnboarding({
        step: 'preferences',
        completed: true,
        preferences: userPreferences
      });
      setCurrentStep('complete');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      // Still show completion even if save fails
      setCurrentStep('complete');
    }
  };

  const handleQuizSkip = () => {
    setCurrentStep('complete');
  };

  const handleGetStarted = () => {
    navigate('/search');
  };

  const handleExploreRecommendations = () => {
    navigate('/recommendations');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Welcome to CinemaVerse! 🎬
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Let's personalize your experience and get you started with the perfect recommendations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-xl bg-background/50 border border-border/40">
                  <Star className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">AI Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized suggestions based on your taste
                  </p>
                </div>
                
                <div className="p-6 rounded-xl bg-background/50 border border-border/40">
                  <Film className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Track Everything</h3>
                  <p className="text-sm text-muted-foreground">
                    Never lose track of what you want to watch
                  </p>
                </div>
                
                <div className="p-6 rounded-xl bg-background/50 border border-border/40">
                  <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Share & Connect</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your watchlist with friends and family
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => setCurrentStep('quiz')}
                  size="lg"
                  className="w-full md:w-auto px-8 py-3"
                >
                  Start Personalization
                </Button>
                
                <div>
                  <Button
                    variant="ghost"
                    onClick={handleGetStarted}
                    className="text-muted-foreground"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PreferenceQuiz
                onComplete={handleQuizComplete}
                onSkip={handleQuizSkip}
              />
            </motion.div>
          )}

          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  You're all set! 🎉
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  {preferences 
                    ? `We've saved your preferences and are ready to recommend amazing ${preferences.preferredMediaType === 'both' ? 'movies and TV shows' : preferences.preferredMediaType === 'movie' ? 'movies' : 'TV shows'} just for you!`
                    : "You're ready to start exploring CinemaVerse!"
                  }
                </p>
              </div>

              {preferences && (
                <div className="bg-background/50 rounded-xl p-6 mb-8 border border-border/40">
                  <h3 className="font-semibold mb-4">Your Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Favorite Genres:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {preferences.favoriteGenres.slice(0, 3).map((genre) => (
                          <span key={genre} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            {genre}
                          </span>
                        ))}
                        {preferences.favoriteGenres.length > 3 && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                            +{preferences.favoriteGenres.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Mood:</span>
                      <div className="mt-1 font-medium capitalize">{preferences.mood}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="w-full md:w-auto px-8 py-3"
                >
                  Start Exploring
                </Button>
                
                <div>
                  <Button
                    variant="outline"
                    onClick={handleExploreRecommendations}
                    className="w-full md:w-auto"
                  >
                    View Recommendations
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 