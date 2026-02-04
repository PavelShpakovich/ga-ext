import React from 'react';
import { FileText, LucideIcon, Zap, FileCheck, GraduationCap, Coffee } from 'lucide-react';
import { CorrectionStyle } from '@/shared/types';
import { StyleButton } from '@/shared/components/ui';
import { useTranslation } from 'react-i18next';

interface StyleSelectorProps {
  selected: CorrectionStyle;
  onChange: (style: CorrectionStyle) => void;
  disabled?: boolean;
}

interface StyleOption {
  value: CorrectionStyle;
  label: string;
  icon: LucideIcon;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selected, onChange, disabled = false }) => {
  const { t } = useTranslation();

  const styles: StyleOption[] = [
    { value: CorrectionStyle.STANDARD, label: t('styles.standard'), icon: FileCheck },
    { value: CorrectionStyle.FORMAL, label: t('styles.formal'), icon: FileText },
    { value: CorrectionStyle.ACADEMIC, label: t('styles.academic'), icon: GraduationCap },
    { value: CorrectionStyle.SIMPLE, label: t('styles.simple'), icon: Zap },
    { value: CorrectionStyle.CASUAL, label: t('styles.casual'), icon: Coffee },
  ];

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider'>
          {t('settings.correction_style')}
        </h3>
        <div className='sm:hidden text-center text-xs font-semibold text-blue-600 dark:text-blue-400'>
          {styles.find((s) => s.value === selected)?.label}
        </div>
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
