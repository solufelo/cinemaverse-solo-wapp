import { useState, useEffect } from 'react';
import { useAuth } from 'wasp/client/auth';
import { getUserOnboarding, updateUserOnboarding } from 'wasp/client/operations';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface UserPreferences {
  favoriteGenres: string[];
  preferredMediaType: 'movie' | 'tv' | 'both';
  watchTime: 'short' | 'medium' | 'long';
  mood: 'action' | 'drama' | 'comedy' | 'thriller' | 'romance' | 'sci-fi' | 'horror' | 'documentary';
}

export function useOnboarding() {
  const { data: user } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load onboarding steps when user is authenticated
  useEffect(() => {
    if (user) {
      loadOnboardingSteps();
    }
  }, [user]);

  const loadOnboardingSteps = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const onboardingSteps = await getUserOnboarding();
      setSteps(onboardingSteps);
      
      // Show onboarding if user hasn't completed preferences
      const preferencesStep = onboardingSteps.find(step => step.id === 'preferences');
      if (preferencesStep && !preferencesStep.completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load onboarding steps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeStep = async (stepId: string, preferences?: UserPreferences) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const updatedSteps = await updateUserOnboarding({
        step: stepId,
        completed: true,
        preferences
      });
      setSteps(updatedSteps);
      
      // Hide onboarding if preferences are completed
      if (stepId === 'preferences') {
        setShowOnboarding(false);
      }
    } catch (error) {
      console.error('Failed to complete onboarding step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  const getProgress = () => {
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getNextStep = () => {
    return steps.find(step => !step.completed);
  };

  const isStepCompleted = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    return step?.completed || false;
  };

  return {
    steps,
    isLoading,
    showOnboarding,
    progress: getProgress(),
    nextStep: getNextStep(),
    completeStep,
    skipOnboarding,
    isStepCompleted,
    loadOnboardingSteps
  };
} 