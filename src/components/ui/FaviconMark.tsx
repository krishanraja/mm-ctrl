/**
 * Mindmaker Favicon Mark
 * 
 * Displays the favicon icon (2.png) in the top-left corner
 * when the main logo is not present on a page.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { transitions } from '@/lib/motion';

interface FaviconMarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

export const FaviconMark: React.FC<FaviconMarkProps> = ({ 
  className = '',
  size = 'md',
}) => {
  return (
    <motion.div
      className={`fixed top-6 left-6 z-50 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={transitions.default}
    >
      <motion.img 
        src="/2.png" 
        alt="Mindmaker" 
        className={`${sizeClasses[size]} object-contain`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={transitions.fast}
      />
    </motion.div>
  );
};

export default FaviconMark;
