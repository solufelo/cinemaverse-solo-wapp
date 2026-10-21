'use client';
 
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Play, Star, Users, Film } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from 'wasp/client/auth';
import { useNavigate } from 'react-router-dom';
 
export default function GradientHero() {
  const { data: user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/search');
    } else {
      navigate('/signup');
    }
  };

  const handleExplore = () => {
    navigate('/discover');
  };

  return (
    <div className="relative w-full overflow-hidden bg-background">
      {/* Aurora Dream Vivid Bloom Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-pink-500/10 to-blue-500/5"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,_#8b5cf6_0deg,_#ec4899_60deg,_#06b6d4_120deg,_#8b5cf6_180deg,_#ec4899_240deg,_#06b6d4_300deg,_#8b5cf6_360deg)] opacity-30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-400/30 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-400/30 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent"></div>
        <div className="absolute left-1/2 top-0 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-cyan-500/10 blur-3xl"></div>
      </div>
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-10"></div>
 
      <div className="container relative z-10 mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-5xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 flex justify-center"
          >
            <div className="inline-flex items-center rounded-full border border-border bg-background/80 px-3 py-1 text-sm backdrop-blur-sm">
              <span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                New
              </span>
              <span className="text-muted-foreground">
                AI-powered movie recommendations
              </span>
              <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground" />
            </div>
          </motion.div>
 
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-balance bg-gradient-to-tl from-primary/10 via-foreground/85 to-foreground/50 bg-clip-text text-center text-4xl tracking-tighter text-transparent sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Never lose track of what you want to watch again
          </motion.h1>
 
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-center text-lg text-muted-foreground"
          >
            Join 50,000+ movie lovers tracking their favorites with AI-powered recommendations, 
            episode tracking, and personalized insights. Your ultimate entertainment companion.
          </motion.p>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex justify-center"
          >
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>50,000+ users</span>
              </div>
              <div className="flex items-center">
                <Film className="h-4 w-4 mr-1" />
                <span>2M+ movies tracked</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1" />
                <span>4.8/5 rating</span>
              </div>
            </div>
          </motion.div>
 
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              onClick={handleGetStarted}
              className="group relative overflow-hidden rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-primary/30 hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                {user ? 'Start Exploring' : 'Start Your Watchlist'}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 z-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
            </Button>
 
            <Button
              onClick={handleExplore}
              className="flex items-center gap-2 rounded-full border border-border bg-background/50 px-8 py-4 text-lg font-semibold backdrop-blur-sm hover:bg-background/80 transition-all duration-200"
            >
              <Play className="h-5 w-5" />
              Explore Movies & TV Shows
            </Button>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="text-center p-6 rounded-xl bg-background/50 border border-border/40 backdrop-blur-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI Recommendations</h3>
              <p className="text-sm text-muted-foreground">Discover your next favorite with intelligent suggestions</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-background/50 border border-border/40 backdrop-blur-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Film className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Episode Tracking</h3>
              <p className="text-sm text-muted-foreground">Never lose your place in TV shows again</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-background/50 border border-border/40 backdrop-blur-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Share & Connect</h3>
              <p className="text-sm text-muted-foreground">Share your watchlist with friends and family</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-background/50 border border-border/40 backdrop-blur-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Smart Discovery</h3>
              <p className="text-sm text-muted-foreground">Find hidden gems and trending content</p>
            </div>
          </motion.div>
 
          {/* Feature Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.7,
              type: 'spring',
              stiffness: 50,
            }}
            className="relative mx-auto mt-16 max-w-4xl"
          >
            <div className="overflow-hidden rounded-xl border border-border/40 bg-background/50 shadow-xl backdrop-blur-sm">
              <div className="flex h-10 items-center border-b border-border/40 bg-muted/50 px-4">
                <div className="flex space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="mx-auto flex items-center rounded-md bg-background/50 px-3 py-1 text-xs text-muted-foreground">
                  cinemaverse.app - Your Personal Watchlist
                </div>
              </div>
              <div className="relative">
                <img
                  src="/cinemaverse.png"
                  alt="CinemaVerse Logo"
                  className="w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-0"></div>
              </div>
            </div>
 
            {/* Floating elements for visual interest */}
            <div className="absolute -right-6 -top-6 h-12 w-12 rounded-lg border border-border/40 bg-background/80 p-3 shadow-lg backdrop-blur-md">
              <div className="h-full w-full rounded-md bg-primary/20"></div>
            </div>
            <div className="absolute -bottom-4 -left-4 h-8 w-8 rounded-full border border-border/40 bg-background/80 shadow-lg backdrop-blur-md"></div>
            <div className="absolute -bottom-6 right-12 h-10 w-10 rounded-lg border border-border/40 bg-background/80 p-2 shadow-lg backdrop-blur-md">
              <div className="h-full w-full rounded-md bg-green-500/20"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 