import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Users, Film, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

interface GuestModeBannerProps {
  onClose?: () => void;
  showSignupPrompt?: boolean;
}

export default function GuestModeBanner({ onClose, showSignupPrompt = true }: GuestModeBannerProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-primary/20"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Guest Mode</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Film className="h-4 w-4" />
                  <span>Explore content</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>50,000+ users</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {showSignupPrompt && (
                <div className="hidden md:block text-sm text-muted-foreground">
                  <span>Sign up to save your watchlist and get AI recommendations</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogin}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleSignup}
                  className="flex items-center space-x-1"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 