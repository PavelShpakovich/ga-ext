import React from 'react';
import { Star } from 'lucide-react';
import { Section, Divider, FeatureListItem } from '../ui';

const features = [
  '100% private - runs in browser with WebGPU',
  'Works offline after model download',
  'Multiple writing styles available',
];

export const FeaturesList: React.FC = () => {
  return (
    <>
      <Divider className='my-4' />
      <Section
        title={
          <>
            <Star className='w-4 h-4 inline mr-1' />
            Features
          </>
        }
      >
        <ul className='text-xs text-gray-600 dark:text-gray-400 space-y-1.5'>
          {features.map((feature, idx) => (
            <FeatureListItem key={idx} icon={Star}>
              {feature}
            </FeatureListItem>
          ))}
        </ul>
      </Section>
    </>
  );
};
