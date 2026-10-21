'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AboutUs1() {
  return (
    <div className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-6">About CinemaVerse</h2>
            <p className="text-lg text-muted-foreground mb-6">
              We believe everyone deserves to discover amazing stories. CinemaVerse combines the power of AI with comprehensive movie and TV data to create your perfect entertainment companion.
            </p>
            <p className="text-muted-foreground mb-8">
              From blockbuster movies to hidden gem TV shows, our platform helps you find, track, and enjoy the best content across all genres and platforms.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold text-primary">1M+</div>
                <div className="text-muted-foreground">Movies & Shows</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">AI-Powered</div>
                <div className="text-muted-foreground">Recommendations</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-8">
              <img 
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2025&q=80"
                alt="Cinema Experience"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 