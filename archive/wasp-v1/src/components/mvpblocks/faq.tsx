'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function Faq1() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How does the AI recommendation system work?',
      answer: 'Our AI analyzes your watchlist, ratings, and viewing history to suggest movies and TV shows that match your taste. It learns from your preferences to provide increasingly accurate recommendations over time.'
    },
    {
      question: 'Can I track TV show episodes individually?',
      answer: 'Yes! CinemaVerse allows you to track individual episodes of TV shows, mark them as watched, and keep track of your progress through each season.'
    },
    {
      question: 'Is there a limit to how many items I can add to my watchlist?',
      answer: 'Free users can add up to 50 items to their watchlist. Premium subscribers get unlimited watchlist space and access to advanced features.'
    },
    {
      question: 'Where does the movie and TV show data come from?',
      answer: 'We use TMDB (The Movie Database) API to provide comprehensive, up-to-date information about movies and TV shows, including ratings, cast, plot summaries, and more.'
    }
  ];

  return (
    <div className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about CinemaVerse
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border rounded-lg bg-card"
            >
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-muted-foreground">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 