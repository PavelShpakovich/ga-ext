import React from 'react';
import { FileText, LucideIcon, Zap, Languages, GraduationCap, Coffee } from 'lucide-react';
import { CorrectionStyle } from '../types';
import { Button } from './Button';
import { StyleButton } from './ui';
import { useTranslation } from 'react-i18next';

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

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selected, onChange, onRecheck, disabled = false }) => {
  const { t } = useTranslation();

  const styles: StyleOption[] = [
    { value: CorrectionStyle.STANDARD, label: t('styles.standard'), icon: Languages },
    { value: CorrectionStyle.FORMAL, label: t('styles.formal'), icon: FileText },
    { value: CorrectionStyle.ACADEMIC, label: t('styles.academic'), icon: GraduationCap },
    { value: CorrectionStyle.SIMPLE, label: t('styles.simple'), icon: Zap },
    { value: CorrectionStyle.CASUAL, label: t('styles.casual'), icon: Coffee },
  ];

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider'>
          {t('settings.correction_style')}
        </h3>
        {onRecheck && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onRecheck}
            disabled={disabled}
            className='text-[10px] text-blue-500 hover:text-blue-600 disabled:text-gray-400 px-2 py-0.5 h-auto font-bold uppercase tracking-tight'
          >
            {t('actions.recheck')}
          </Button>
        )}
      </div>

      <div className='grid grid-cols-5 gap-1.5'>
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
