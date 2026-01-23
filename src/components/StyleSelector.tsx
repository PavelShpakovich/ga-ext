import React from 'react';
import { CorrectionStyle } from '../types';
import { Button } from './Button';

interface StyleSelectorProps {
  selected: CorrectionStyle;
  onChange: (style: CorrectionStyle) => void;
  onRecheck?: () => void;
  disabled?: boolean;
}

const styles = [
  { value: CorrectionStyle.FORMAL, label: 'Formal', icon: '👔' },
  { value: CorrectionStyle.CASUAL, label: 'Casual', icon: '😊' },
  { value: CorrectionStyle.BRIEF, label: 'Brief', icon: '⚡' },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selected, onChange, onRecheck, disabled = false }) => {
  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>Correction Style</h3>
        {onRecheck && (
          <button
            onClick={onRecheck}
            disabled={disabled}
            className='text-xs text-primary-500 hover:text-primary-600 disabled:text-gray-400'
          >
            Re-check
          </button>
        )}
      </div>

      <div className='grid grid-cols-3 gap-2'>
        {styles.map((style) => (
          <button
            key={style.value}
            onClick={() => onChange(style.value)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border-2 transition-all
              ${
                selected === style.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className='text-2xl mb-1'>{style.icon}</div>
            <div
              className={`text-sm font-medium ${
                selected === style.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {style.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
