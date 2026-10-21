'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Film, Search, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from 'wasp/client/auth';
import { logout } from 'wasp/client/auth';

interface NavItem {
  name: string;
  href: string;
}

const publicNavItems: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Discover', href: '/discover' },
  { name: 'Movies', href: '/movies' },
  { name: 'TV Shows', href: '/tv-shows' },
  { name: 'Genres', href: '/genres' },
];

const authenticatedNavItems: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Discover', href: '/discover' },
  { name: 'Movies', href: '/movies' },
  { name: 'TV Shows', href: '/tv-shows' },
  { name: 'Search', href: '/search' },
  { name: 'Watchlist', href: '/watchlist' },
  { name: 'Recommendations', href: '/recommendations' },
  { name: 'Forum', href: '/forum' },
];

export default function Header2() {
  const { data: user, isLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      x: '100%',
      transition: {
        duration: 0.3,
        ease: 'easeInOut' as const,
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut' as const,
        staggerChildren: 0.1,
      },
    },
  };

  const mobileItemVariants = {
    closed: { opacity: 0, x: 20 },
    open: { opacity: 1, x: 0 },
  };

  const userMenuVariants = {
    closed: {
      opacity: 0,
      y: -10,
      scale: 0.95,
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  };

  // Use appropriate navigation items based on auth status
  const navItems = user ? authenticatedNavItems : publicNavItems;

  return (
    <>
      <motion.header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'border-b border-gray-200 bg-gray-100 shadow-sm'
            : 'bg-gray-50'
        }`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              className="flex items-center space-x-3 flex-shrink-0"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <a href="/" className="flex items-center space-x-3">
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 shadow-lg">
                    <Film className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-green-400"></div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-lg font-bold text-foreground truncate">
                    CinemaVerse
                  </span>
                  <span className="-mt-1 text-xs text-muted-foreground truncate">
                    Your cinema universe
                  </span>
                </div>
              </a>
            </motion.div>

            <nav className="hidden items-center space-x-1 lg:flex flex-1 justify-center max-w-2xl">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <a
                    href={item.href}
                    className="relative rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:text-foreground whitespace-nowrap"
                  >
                    {hoveredItem === item.name && (
                      <motion.div
                        className="absolute inset-0 rounded-lg bg-muted"
                        layoutId="navbar-hover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                  </a>
                </motion.div>
              ))}
            </nav>

            <motion.div
              className="hidden items-center space-x-2 lg:flex flex-shrink-0"
              variants={itemVariants}
            >
              {user ? (
                // Authenticated user - show user menu
                <div className="relative">
                  <motion.button
                    className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate max-w-24">{user.username || 'User'}</span>
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg"
                        variants={userMenuVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-2">
                          <a
                            href="/account"
                            className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors duration-200 hover:bg-muted hover:text-foreground"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Account Settings</span>
                          </a>
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors duration-200 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Unauthenticated user - show auth buttons
                <>
                  <motion.button
                    className="rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Search className="h-5 w-5" />
                  </motion.button>

                  <a
                    href="/login"
                    className="px-3 py-2 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:text-foreground whitespace-nowrap"
                  >
                    Sign In
                  </a>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <a
                      href="/signup"
                      className="inline-flex items-center space-x-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-foreground/90 whitespace-nowrap"
                    >
                      <span>Start Watching</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </motion.div>
                </>
              )}
            </motion.div>

            <motion.button
              className="rounded-lg p-2 text-foreground transition-colors duration-200 hover:bg-muted lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variants={itemVariants}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed right-4 top-16 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl lg:hidden"
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="space-y-6 p-6">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <motion.div key={item.name} variants={mobileItemVariants}>
                      <a
                        href={item.href}
                        className="block rounded-lg px-4 py-3 font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="space-y-3 border-t border-border pt-6"
                  variants={mobileItemVariants}
                >
                  {user ? (
                    // Authenticated user mobile menu
                    <>
                      <a
                        href="/account"
                        className="block w-full rounded-lg py-3 text-center font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Account Settings
                      </a>
                      <button
                        onClick={handleLogout}
                        className="block w-full rounded-lg py-3 text-center font-medium text-red-600 transition-colors duration-200 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    // Unauthenticated user mobile menu
                    <>
                      <a
                        href="/login"
                        className="block w-full rounded-lg py-3 text-center font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </a>
                      <a
                        href="/signup"
                        className="block w-full rounded-lg bg-foreground py-3 text-center font-medium text-white transition-all duration-200 hover:bg-foreground/90"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Start Watching
                      </a>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
} 