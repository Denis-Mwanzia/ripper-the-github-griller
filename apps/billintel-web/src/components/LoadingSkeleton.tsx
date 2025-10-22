import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  lines = 1,
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="skeleton h-4 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        />
      ))}
    </div>
  );
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-8"
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 skeleton rounded-2xl"></div>
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-24 rounded"></div>
          <div className="skeleton h-8 w-32 rounded"></div>
        </div>
      </div>
    </motion.div>
  );
};

export const ChartCardSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-8"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 skeleton rounded-xl"></div>
        <div className="skeleton h-6 w-32 rounded"></div>
      </div>
      <div className="skeleton h-64 w-full rounded-lg"></div>
    </motion.div>
  );
};

