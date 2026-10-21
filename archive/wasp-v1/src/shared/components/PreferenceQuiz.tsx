import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';

export interface UserPreferences {
  favoriteGenres: string[];
  preferredMediaType: 'movie' | 'tv' | 'both';
  watchTime: 'short' | 'medium' | 'long';
  mood: 'action' | 'drama' | 'comedy' | 'thriller' | 'romance' | 'sci-fi' | 'horror' | 'documentary';
}

interface PreferenceQuizProps {
  onComplete: (preferences: UserPreferences) => void;
  onSkip: () => void;
}

const genres = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 
  'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
];

const mediaTypes = [
  { value: 'movie', label: 'Movies', icon: '🎬' },
  { value: 'tv', label: 'TV Shows', icon: '📺' },
  { value: 'both', label: 'Both', icon: '🎭' }
];

const watchTimes = [
  { value: 'short', label: 'Short (under 2 hours)', description: 'Quick entertainment' },
  { value: 'medium', label: 'Medium (2-3 hours)', description: 'Standard viewing' },
  { value: 'long', label: 'Long (3+ hours)', description: 'Epic experiences' }
];

const moods = [
  { value: 'action', label: 'Action & Adventure', icon: '💥' },
  { value: 'drama', label: 'Drama', icon: '🎭' },
  { value: 'comedy', label: 'Comedy', icon: '😂' },
  { value: 'thriller', label: 'Thriller', icon: '😱' },
  { value: 'romance', label: 'Romance', icon: '💕' },
  { value: 'sci-fi', label: 'Sci-Fi', icon: '🚀' },
  { value: 'horror', label: 'Horror', icon: '👻' },
  { value: 'documentary', label: 'Documentary', icon: '📚' }
];

export default function PreferenceQuiz({ onComplete, onSkip }: PreferenceQuizProps) {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteGenres: [],
    preferredMediaType: 'both',
    watchTime: 'medium',
    mood: 'action'
  });

  const handleGenreToggle = (genre: string) => {
    setPreferences(prev => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(genre)
        ? prev.favoriteGenres.filter(g => g !== genre)
        : [...prev.favoriteGenres, genre]
    }));
  };

  const handleMediaTypeSelect = (type: 'movie' | 'tv' | 'both') => {
    setPreferences(prev => ({ ...prev, preferredMediaType: type }));
  };

  const handleWatchTimeSelect = (time: 'short' | 'medium' | 'long') => {
    setPreferences(prev => ({ ...prev, watchTime: time }));
  };

  const handleMoodSelect = (mood: 'action' | 'drama' | 'comedy' | 'thriller' | 'romance' | 'sci-fi' | 'horror' | 'documentary') => {
    setPreferences(prev => ({ ...prev, mood }));
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete(preferences);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">What genres do you love?</h2>
              <p className="text-muted-foreground">Select all that apply (we'll use this to personalize your experience)</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    preferences.favoriteGenres.includes(genre)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">What do you prefer to watch?</h2>
              <p className="text-muted-foreground">Choose your preferred content type</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mediaTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleMediaTypeSelect(type.value as 'movie' | 'tv' | 'both')}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                    preferences.preferredMediaType === type.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="font-semibold">{type.label}</div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">How long do you like to watch?</h2>
              <p className="text-muted-foreground">Select your preferred viewing duration</p>
            </div>
            
            <div className="space-y-3">
              {watchTimes.map((time) => (
                <button
                  key={time.value}
                  onClick={() => handleWatchTimeSelect(time.value as 'short' | 'medium' | 'long')}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    preferences.watchTime === time.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold">{time.label}</div>
                  <div className="text-sm text-muted-foreground">{time.description}</div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">What's your current mood?</h2>
              <p className="text-muted-foreground">We'll use this to suggest content that matches your vibe</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                    preferences.mood === mood.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{mood.icon}</div>
                  <div className="text-sm font-medium">{mood.label}</div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Step {step} of 4</span>
          <span className="text-sm text-muted-foreground">{Math.round((step / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <motion.div
            className="bg-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      {renderStep()}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
        <div>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center gap-2"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-muted-foreground"
          >
            Skip
          </Button>
          
          <Button
            onClick={nextStep}
            className="flex items-center gap-2"
            disabled={step === 1 && preferences.favoriteGenres.length === 0}
          >
            {step === 4 ? (
              <>
                Complete Setup
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 