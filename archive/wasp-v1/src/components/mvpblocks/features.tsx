'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Brain, Heart, Star } from 'lucide-react';

export default function Feature1() {
  const features = [
    {
      icon: Search,
      title: 'Smart Discovery',
      description: 'Find your next favorite movie or TV show with intelligent search powered by TMDB.'
    },
    {
      icon: Brain,
      title: 'AI Recommendations',
      description: 'Get personalized recommendations based on your watchlist and preferences.'
    },
    {
      icon: Heart,
      title: 'Personal Watchlist',
      description: 'Track what you want to watch, what you\'re watching, and what you\'ve completed.'
    },
    {
      icon: Star,
      title: 'Rate & Review',
      description: 'Rate your watched content and get insights from our AI-powered analysis.'
    }
  ];

  return (
    <div className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Why Choose CinemaVerse</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your ultimate companion for discovering, tracking, and enjoying the best of cinema and television.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-6 rounded-lg border bg-card"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 