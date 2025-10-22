import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';

interface AnalyzeButtonProps {
  hasInput: boolean;
  loading: boolean;
  onAnalyze: () => void;
}

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({
  hasInput,
  loading,
  onAnalyze,
}) => {
  return (
    <motion.button
      disabled={!hasInput || loading}
      onClick={onAnalyze}
      className={`w-full font-bold py-6 px-8 rounded-3xl shadow-2xl transform transition-all duration-300 focus-ring ${
        hasInput && !loading
          ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white hover:shadow-3xl hover:scale-105 hover:-translate-y-1'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
      whileHover={{
        scale: hasInput && !loading ? 1.05 : 1,
        y: hasInput && !loading ? -2 : 0,
      }}
      whileTap={{ scale: hasInput && !loading ? 0.95 : 1 }}
      animate={loading ? { scale: [1, 1.02, 1] } : {}}
      transition={loading ? { repeat: Infinity, duration: 2 } : {}}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-4">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Analyzing with AI...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-4">
          <Zap className="w-6 h-6" />
          <span className="text-lg">Analyze Billing Data</span>
        </div>
      )}
    </motion.button>
  );
};
