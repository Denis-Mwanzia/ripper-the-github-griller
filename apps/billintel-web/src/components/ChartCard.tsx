import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  delay: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  icon: Icon,
  children,
  delay,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="card p-8"
    >
      <div className="flex items-center space-x-3 mb-6">
        <motion.div
          className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon className="w-5 h-5 text-blue-600" />
        </motion.div>
        <h3 className="text-xl font-bold text-gradient-primary">{title}</h3>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
