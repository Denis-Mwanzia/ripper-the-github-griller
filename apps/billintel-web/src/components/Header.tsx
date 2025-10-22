import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Menu,
  X,
  Upload,
  BarChart3,
  History,
  User,
  LogIn,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  hasResult: boolean;
  activeTab: 'upload' | 'insights' | 'history' | 'dashboard';
  onTabChange: (tab: 'upload' | 'insights' | 'history' | 'dashboard') => void;
  user: any;
  onAuthClick: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasResult,
  activeTab,
  onTabChange,
  user,
  onAuthClick,
  onSignOut,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTabClick = (
    tab: 'upload' | 'insights' | 'history' | 'dashboard',
  ) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const handleAuthClick = () => {
    onAuthClick();
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    onSignOut();
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <motion.div
            className="flex items-center space-x-2 sm:space-x-4"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                BillIntel
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block">
                AI-Powered Billing Intelligence
              </p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-gray-600 font-medium">AI Ready</span>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange('upload')}
                className={`px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base focus-ring ${
                  activeTab === 'upload'
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-2xl'
                    : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-2xl'
                }`}
              >
                Upload Data
              </motion.button>

              {hasResult && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTabChange('insights')}
                  className={`px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base ${
                    activeTab === 'insights'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                      : 'bg-white/80 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  View Insights
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange('history')}
                className={`px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/80 text-gray-700 hover:bg-gray-50'
                }`}
              >
                History
              </motion.button>

              {user && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTabChange('dashboard')}
                  className={`px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                      : 'bg-white/80 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </motion.button>
              )}

              {user ? (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSignOut}
                  className="px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base bg-white/80 text-gray-700 hover:bg-gray-50"
                >
                  Sign Out
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAuthClick}
                  className="px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                >
                  Sign In
                </motion.button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMobileMenu}
              className="p-2 rounded-xl bg-white/80 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl"
            >
              <div className="py-4 space-y-2">
                {/* AI Ready Status */}
                <div className="flex items-center justify-center space-x-2 text-sm mb-4">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 font-medium">AI Ready</span>
                </div>

                {/* Navigation Items */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabClick('upload')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === 'upload'
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-semibold">Upload Data</span>
                </motion.button>

                {hasResult && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTabClick('insights')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeTab === 'insights'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-semibold">View Insights</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabClick('history')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <History className="w-5 h-5" />
                  <span className="font-semibold">History</span>
                </motion.button>

                {user && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTabClick('dashboard')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeTab === 'dashboard'
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-semibold">Dashboard</span>
                  </motion.button>
                )}

                {/* Auth Button */}
                <div className="pt-2 border-t border-gray-200">
                  {user ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-300"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-semibold">Sign Out</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAuthClick}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transition-all duration-300"
                    >
                      <LogIn className="w-5 h-5" />
                      <span className="font-semibold">Sign In</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
