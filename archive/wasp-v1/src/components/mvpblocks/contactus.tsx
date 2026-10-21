'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, Github } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
          <p className="text-xl text-muted-foreground">
            Have questions about CinemaVerse? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-primary mr-4" />
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-muted-foreground">hello@cinemaverse.app</div>
                </div>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-6 w-6 text-primary mr-4" />
                <div>
                  <div className="font-medium">Discord</div>
                  <div className="text-muted-foreground">Join our community</div>
                </div>
              </div>
              <div className="flex items-center">
                <Github className="h-6 w-6 text-primary mr-4" />
                <div>
                  <div className="font-medium">GitHub</div>
                  <div className="text-muted-foreground">Open source contributions</div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">What can we help with?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI recommendation questions</li>
                <li>• Watchlist management</li>
                <li>• Feature requests</li>
                <li>• Bug reports</li>
                <li>• API integration help</li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border rounded-lg bg-background"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 border rounded-lg bg-background"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <select className="w-full px-4 py-3 border rounded-lg bg-background">
                <option>General Question</option>
                <option>Feature Request</option>
                <option>Bug Report</option>
                <option>AI Recommendations</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border rounded-lg bg-background"
                placeholder="Tell us how we can help..."
              />
            </div>
            <button className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Send Message
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 