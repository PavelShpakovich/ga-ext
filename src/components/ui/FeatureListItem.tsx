import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureListItemProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

export const FeatureListItem: React.FC<FeatureListItemProps> = ({ icon: Icon, children }) => {
  return (
    <li className='flex items-start gap-2'>
      <Icon className='w-3 h-3 mt-0.5 flex-shrink-0' />
      <span>{children}</span>
    </li>
  );
};
