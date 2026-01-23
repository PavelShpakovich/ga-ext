import React from 'react';
import { Change } from '../../types';

interface ChangesListProps {
  changes: Change[];
}

const getBadgeStyle = (type: Change['type']): string => {
  const styles = {
    grammar: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    spelling: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    punctuation: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    style: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    clarity: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    error: 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300',
  };
  return styles[type] || styles.error;
};

export const ChangesList: React.FC<ChangesListProps> = ({ changes }) => {
  if (!changes || changes.length === 0) {
    return (
      <div className='mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
        <p className='text-sm text-green-700 dark:text-green-400'>✓ No corrections needed - your text looks great!</p>
      </div>
    );
  }

  return (
    <div className='mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
      <h4 className='text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3'>Issues Found ({changes.length})</h4>
      <div className='space-y-3'>
        {changes.map((change, idx) => (
          <div key={idx} className='flex gap-2'>
            <span className='text-blue-600 dark:text-blue-400 font-semibold shrink-0'>{idx + 1}.</span>
            <div>
              <span
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getBadgeStyle(change.type)} mb-1`}
              >
                {change.type}
              </span>
              <p className='text-sm text-gray-700 dark:text-gray-300'>{change.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
