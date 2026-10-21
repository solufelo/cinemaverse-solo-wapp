import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, Film, Star, Calendar } from 'lucide-react';
import { useAuth } from 'wasp/client/auth';
import { logout } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getWatchlist } from 'wasp/client/operations';

export default function AccountPage() {
  const { data: user } = useAuth();
  const { data: watchlist } = useQuery(getWatchlist);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const stats = [
    {
      label: 'Total Items',
      value: watchlist?.length || 0,
      icon: Film,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Completed',
      value: watchlist?.filter(item => item.status === 'COMPLETED').length || 0,
      icon: Star,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Watching',
      value: watchlist?.filter(item => item.status === 'WATCHING').length || 0,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your CinemaVerse account and preferences</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {stats.map((stat, index) => (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Account Information */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <p className="text-gray-900">User email</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <p className="text-gray-900">User name</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <p className="text-gray-900">Free Plan (50 items limit)</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/search"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
              >
                <Film className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Search Movies</p>
                  <p className="text-sm text-gray-600">Find new content to watch</p>
                </div>
              </a>
              <a
                href="/watchlist"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
              >
                <Star className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">My Watchlist</p>
                  <p className="text-sm text-gray-600">Manage your saved items</p>
                </div>
              </a>
              <a
                href="/recommendations"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
              >
                <Settings className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">AI Recommendations</p>
                  <p className="text-sm text-gray-600">Get personalized suggestions</p>
                </div>
              </a>
              <a
                href="/pricing"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
              >
                <Star className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Upgrade Plan</p>
                  <p className="text-sm text-gray-600">Unlock unlimited features</p>
                </div>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-red-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="px-6 py-4 border-b border-red-200">
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Sign Out</p>
                <p className="text-sm text-gray-600">Sign out of your account</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
