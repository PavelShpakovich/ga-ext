import React from 'react';
import { Zap, Gauge, Snail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModelInfo {
  id: string;
  family: string;
  speed: 'fast' | 'medium' | 'slow';
  size: string;
  description: string;
}

interface ModelInfoCardProps {
  model: ModelInfo;
  className?: string;
}

export const ModelInfoCard: React.FC<ModelInfoCardProps> = ({ model, className = '' }) => {
  const { t } = useTranslation();

  const speedConfig = {
    fast: { icon: Zap, label: t('models.speed.fast'), className: 'text-green-600 dark:text-green-400' },
    medium: { icon: Gauge, label: t('models.speed.medium'), className: 'text-yellow-600 dark:text-yellow-400' },
    slow: { icon: Snail, label: t('models.speed.slow'), className: 'text-orange-600 dark:text-orange-400' },
  };

  const { icon: SpeedIcon, label: speedLabel, className: speedColor } = speedConfig[model.speed];

  return (
    <div
      className={`p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 ${className}`}
    >
      <div className='flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-2'>
        <span className='px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300'>
          {model.family}
        </span>
        <span className='flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300'>
          <SpeedIcon className={`w-3 h-3 ${speedColor}`} />
          {speedLabel}
        </span>
        <span className='px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300'>
          {model.size}
        </span>
      </div>
      <p className='text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium'>
        {t(`models.descriptions.${model.id}`, { defaultValue: model.description })}
      </p>
    </div>
  );
};
