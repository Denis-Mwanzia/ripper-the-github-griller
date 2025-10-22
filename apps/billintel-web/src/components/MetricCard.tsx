import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  color: string;
  bgColor: string;
  delay: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  title,
  value,
  color,
  bgColor,
  delay,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="card card-hover p-8"
    >
      <div className="flex items-center space-x-4">
        <motion.div
          className={`w-16 h-16 ${bgColor} rounded-2xl flex items-center justify-center shadow-lg`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className={`w-8 h-8 ${color}`} />
        </motion.div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          <motion.p 
            className="text-3xl font-bold text-gray-900 mt-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring", stiffness: 300 }}
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};
