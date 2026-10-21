'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Check } from 'lucide-react';

export default function MeshyCards() {
  const cards = [
    {
      title: 'Free Plan',
      price: '$0',
      features: ['Up to 50 watchlist items', 'Basic AI recommendations', 'Movie & TV search', 'Community support'],
      popular: false
    },
    {
      title: 'Premium Plan',
      price: '$9.99',
      features: ['Unlimited watchlist', 'Advanced AI recommendations', 'Episode tracking', 'Priority support', 'Export data'],
      popular: true
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
          <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-muted-foreground">
            Start free or unlock premium features for the ultimate cinema experience
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl border ${
                card.popular 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border bg-card'
              }`}
            >
              {card.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                <div className="text-4xl font-bold mb-6">
                  {card.price}
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  card.popular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}>
                  {card.price === '$0' ? 'Start Free' : 'Get Premium'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 