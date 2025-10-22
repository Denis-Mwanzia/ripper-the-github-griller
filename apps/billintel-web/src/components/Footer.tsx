import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 mt-20 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <motion.div
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-gray-600 font-medium">
              MIT Licensed. © BillIntel
            </span>
          </motion.div>
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <motion.span className="font-medium" whileHover={{ scale: 1.05 }}>
              Powered by Google Genkit
            </motion.span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <motion.span className="font-medium" whileHover={{ scale: 1.05 }}>
              AI-Powered Analytics
            </motion.span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
