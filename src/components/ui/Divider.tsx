import React from 'react';

interface DividerProps {
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ className = '' }) => {
  return <div className={`border-t border-gray-200 dark:border-gray-700 ${className}`} />;
};
