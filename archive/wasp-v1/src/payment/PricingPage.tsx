import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { useAuth } from 'wasp/client/auth';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const { data: user } = useAuth();
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started with movie tracking',
      features: [
        'Track up to 50 movies & TV shows',
        'Basic search functionality',
        'Simple watchlist management',
        'Email support'
      ],
      popular: false,
      cta: 'Get Started',
      href: user ? '/search' : '/signup'
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: 'per month',
      description: 'Unlimited tracking with AI-powered recommendations',
      features: [
        'Unlimited movie & TV show tracking',
        'AI-powered recommendations',
        'Advanced search filters',
        'Episode tracking for TV shows',
        'Export your watchlist',
        'Priority support',
        'Ad-free experience'
      ],
      popular: true,
      cta: 'Start Free Trial',
      href: user ? '/account' : '/signup'
    },
    {
      name: 'Premium',
      price: '$19.99',
      period: 'per month',
      description: 'Everything Pro plus advanced features',
      features: [
        'All Pro features',
        'AI-generated content summaries',
        'Personalized movie reviews',
        'Social features (coming soon)',
        'API access',
        'Advanced analytics',
        'Dedicated support'
      ],
      popular: false,
      cta: 'Coming Soon',
      href: '#'
    }
  ];

  const handlePlanClick = (href: string) => {
    if (href === '#') {
      // Coming soon
      return;
    }
    navigate(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Choose Your <span className="text-blue-600">CinemaVerse</span> Plan
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Start tracking your favorite movies and TV shows. Upgrade anytime to unlock AI-powered recommendations and unlimited tracking.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl bg-white p-8 shadow-lg border-2 ${
                plan.popular 
                  ? 'border-blue-500 scale-105' 
                  : 'border-gray-200'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanClick(plan.href)}
                disabled={plan.href === '#'}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  plan.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                    : plan.href === '#'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens to my data if I downgrade?</h3>
              <p className="text-gray-600">Your watchlist data is always preserved. If you exceed the free tier limit, you'll need to upgrade to continue adding new items.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-gray-600">Absolutely. We use industry-standard encryption and never share your personal data with third parties.</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="bg-blue-50 rounded-2xl p-8">
            <Star className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to start your cinematic journey?</h3>
            <p className="text-gray-600 mb-6">Join thousands of movie enthusiasts who are already tracking their favorite films and discovering new ones.</p>
            <button
              onClick={() => navigate(user ? '/search' : '/signup')}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200"
            >
              {user ? 'Start Exploring' : 'Get Started Free'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
