import React from 'react';
import { FileText, MessageCircle, Zap, LucideIcon } from 'lucide-react';
import { CorrectionStyle } from '../types';
import { Button } from './Button';
import { StyleButton } from './ui';

interface StyleSelectorProps {
  selected: CorrectionStyle;
  onChange: (style: CorrectionStyle) => void;
  onRecheck?: () => void;
  disabled?: boolean;
}

interface StyleOption {
  value: CorrectionStyle;
  label: string;
  icon: LucideIcon;
}

const styles: StyleOption[] = [
  { value: CorrectionStyle.FORMAL, label: 'Formal', icon: FileText },
  { value: CorrectionStyle.CASUAL, label: 'Casual', icon: MessageCircle },
  { value: CorrectionStyle.BRIEF, label: 'Brief', icon: Zap },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selected, onChange, onRecheck, disabled = false }) => {
  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>Correction Style</h3>
        {onRecheck && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onRecheck}
            disabled={disabled}
            className='text-xs text-primary-500 hover:text-primary-600 disabled:text-gray-400 px-2 py-1'
          >
            Re-check
          </Button>
        )}
      </div>

      <div className='grid grid-cols-3 gap-2'>
        {styles.map((style) => (
          <StyleButton
            key={style.value}
            icon={style.icon}
            label={style.label}
            isSelected={selected === style.value}
            disabled={disabled}
            onClick={() => onChange(style.value)}
          />
        ))}
      </div>
    </div>
  );
};
