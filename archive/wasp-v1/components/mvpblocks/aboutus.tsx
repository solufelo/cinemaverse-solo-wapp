'use client';

import React from "react";
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Globe,
  Target,
} from 'lucide-react';

interface AboutUsProps {
  className?: string;
}

export default function AboutUs({ className }: AboutUsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div className={`py-24 ${className}`}>
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">About Us</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We are passionate about creating innovative solutions that help businesses grow and succeed in the digital age.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Global Reach</h3>
                  <p className="text-muted-foreground">Serving customers worldwide with our innovative solutions.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Focused Mission</h3>
                  <p className="text-muted-foreground">Dedicated to delivering exceptional value to our clients.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted-foreground mb-6">
                To be the leading provider of innovative digital solutions that empower businesses to achieve their full potential.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Happy Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">1000+</div>
                  <div className="text-sm text-muted-foreground">Projects Completed</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
 