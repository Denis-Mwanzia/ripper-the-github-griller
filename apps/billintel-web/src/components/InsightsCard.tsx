import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface InsightsCardProps {
  insights: string;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({ insights }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-3xl p-8 shadow-xl border border-blue-200/50 hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-center space-x-4 mb-6">
        <motion.div
          className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Sparkles className="w-6 h-6 text-blue-600" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gradient-primary">
          AI Analysis
        </h3>
      </div>
      <motion.div
        className="prose prose-lg max-w-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <p className="text-gray-700 leading-relaxed whitespace-pre-line font-medium">
          {insights}
        </p>
      </motion.div>
    </motion.div>
  );
};
