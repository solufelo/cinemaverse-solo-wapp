import React from 'react';
import { motion } from 'framer-motion';
import { X, Star, Users, Film, ArrowRight, Lock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SignupPromptProps {
  onClose: () => void;
  feature?: string;
  isVisible: boolean;
}

export default function SignupPrompt({ onClose, feature = 'this feature', isVisible }: SignupPromptProps) {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-xl p-6 max-w-md w-full border border-border/40 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Sign Up Required</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-muted-foreground mb-6">
          To use {feature}, you'll need to create a free account. Join 50,000+ users who are already tracking their favorite movies and TV shows!
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Star className="h-5 w-5 text-primary" />
            <div>
              <div className="font-semibold text-sm">AI-Powered Recommendations</div>
              <div className="text-xs text-muted-foreground">Get personalized suggestions</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Film className="h-5 w-5 text-primary" />
            <div>
              <div className="font-semibold text-sm">Unlimited Watchlist</div>
              <div className="text-xs text-muted-foreground">Save and track everything</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="font-semibold text-sm">Share & Connect</div>
              <div className="text-xs text-muted-foreground">Share with friends and family</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSignup}
            className="w-full flex items-center justify-center space-x-2"
          >
            <span>Create Free Account</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleLogin}
              className="text-muted-foreground hover:text-foreground"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 