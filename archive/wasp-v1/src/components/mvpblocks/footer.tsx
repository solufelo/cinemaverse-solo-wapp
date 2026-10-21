'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Film } from 'lucide-react';

export default function Footer4Col() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <Film className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold">CinemaVerse</h3>
            </div>
            <p className="text-muted-foreground">
              Your personal cinema universe. Discover, track, and get AI-powered recommendations for the best movies and TV shows.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold">Features</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="/search" className="hover:text-foreground">Movie Search</a></li>
              <li><a href="/watchlist" className="hover:text-foreground">Watchlist</a></li>
              <li><a href="/recommendations" className="hover:text-foreground">AI Recommendations</a></li>
              <li><a href="#" className="hover:text-foreground">TV Episode Tracking</a></li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold">Support</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Help Center</a></li>
              <li><a href="#" className="hover:text-foreground">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground">API Status</a></li>
              <li><a href="#" className="hover:text-foreground">Community</a></li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold">Legal</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-foreground">Data Usage</a></li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t mt-12 pt-8 text-center text-muted-foreground"
        >
          <p>&copy; 2024 CinemaVerse. All rights reserved. Powered by TMDB and AI.</p>
        </motion.div>
      </div>
    </footer>
  );
} 