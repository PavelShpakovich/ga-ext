import React from 'react';
import { Settings as SettingsIcon, Download, Check, Loader2, Trash2 } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Select } from '@/shared/components/ui/Select';
import { Button, ButtonVariant } from '@/shared/components/Button';
import { IconButton, IconButtonVariant, IconButtonSize } from '@/shared/components/ui/IconButton';
import { Progress } from '@/shared/components/ui/Progress';
import { ModelInfoCard } from '@/shared/components/ui/ModelInfoCard';
import { TextButton, TextButtonVariant } from '@/shared/components/ui/TextButton';
import { normalizeDownloadProgress } from '@/shared/utils/helpers';
import { ModelOption, ExecutionStep, ModelProgress } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/shared/hooks/useSettings';
import { LanguageCompatibilityBadge } from '@/features/models/LanguageCompatibilityBadge';

interface ModelSectionProps {
  selectedModel: string;
  onModelChange: (id: string) => void;
  modelOptions: { label: string; options: { value: string; label: string }[] }[];
  modelInfo?: ModelOption;
  isModelCached: boolean;
  isCheckingCache: boolean;
  isPrefetching: boolean;
  isRemovingModel: boolean;
  isBusy: boolean;
  step: ExecutionStep;
  downloadProgress: ModelProgress | null;
  onPrefetch: () => void;
  onRemoveModel: () => void;
  onStopDownload: () => void;
  title: string;
}

export const ModelSection: React.FC<ModelSectionProps> = ({
  selectedModel,
  onModelChange,
  modelOptions,
  modelInfo,
  isModelCached,
  isCheckingCache,
  isPrefetching,
  isRemovingModel,
  isBusy,
  step,
  downloadProgress,
  onPrefetch,
  onRemoveModel,
  onStopDownload,
  title,
}) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const normalizedProgress = downloadProgress ? normalizeDownloadProgress(downloadProgress.progress) : 0;

  return (
    <Card
      title={title}
      icon={<SettingsIcon className='w-3.5 h-3.5' />}
      collapsible={true}
      defaultCollapsed={isModelCached && !isCheckingCache}
      badge={
        isCheckingCache ? (
          <div className='flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 animate-in fade-in zoom-in duration-300'>
            <Loader2 className='w-3 h-3 animate-spin text-blue-500' />
            <span className='text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight'>
              {t('ui.checking')}
            </span>
          </div>
        ) : isModelCached ? (
          <div className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 animate-in fade-in duration-500'>
            <Check className='w-3 h-3 text-emerald-500' />
            <span className='text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight'>
              {t('ui.ready')}
            </span>
          </div>
        ) : null
      }
    >
      <div className='space-y-4'>
        <Select
          value={selectedModel}
          onChange={onModelChange}
          groups={modelOptions}
          disabled={isBusy}
          className='text-sm font-medium py-3 rounded-xl'
        />

        {modelInfo && (
          <div className='space-y-3'>
            <ModelInfoCard model={modelInfo} />
            <div className='flex items-center justify-between px-1'>
              <span className='text-xs font-semibold text-slate-600 dark:text-slate-400'>
                {t('models.language_support')}
              </span>
              <LanguageCompatibilityBadge
                modelId={selectedModel}
                language={settings.correctionLanguage}
                showLabel={true}
              />
            </div>
          </div>
        )}

        <div className='flex gap-3'>
          {isCheckingCache ? (
            <div className='flex-1 h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 text-sm font-semibold selection:bg-transparent'>
              <Loader2 className='w-4 h-4 animate-spin text-blue-500' />
              <span className='text-slate-500 dark:text-slate-400'>{t('ui.checking')}</span>
            </div>
          ) : isModelCached && !isPrefetching && step !== ExecutionStep.PREPARING_MODEL ? (
            <div className='flex-1 h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 text-sm font-semibold selection:bg-transparent'>
              <Check className='w-4 h-4 text-green-500' />
              {t('ui.optimized_ready')}
            </div>
          ) : (
            <Button
              onClick={onPrefetch}
              disabled={isBusy}
              variant={isModelCached ? ButtonVariant.SECONDARY : ButtonVariant.PRIMARY}
              className='flex-1 group'
              aria-busy={isPrefetching || step === ExecutionStep.PREPARING_MODEL}
            >
              {isPrefetching ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  {t('ui.syncing')}
                </>
              ) : step === ExecutionStep.PREPARING_MODEL ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  {t('ui.loading')}
                </>
              ) : (
                <>
                  <Download className='w-4 h-4 transition-transform group-hover:translate-y-0.5' />
                  {t('ui.cache_offline')}
                </>
              )}
            </Button>
          )}
          {isModelCached && (
            <IconButton
              icon={<Trash2 />}
              variant={IconButtonVariant.OUTLINE}
              onClick={onRemoveModel}
              disabled={isRemovingModel || isBusy}
              size={IconButtonSize.MD}
              title={t('ui.flush_cache')}
              aria-label={t('ui.flush_cache')}
              className='text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/30'
            />
          )}
        </div>

        {downloadProgress && (
          <div
            className='bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-300 shadow-sm'
            role='status'
            aria-live='polite'
          >
            <div className='space-y-2.5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-start gap-2 min-w-0'>
                  <div className='w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0 mt-1.5' />
                  <span className='text-[10px] font-bold text-blue-700 dark:text-blue-400 tracking-wider leading-relaxed wrap-break-word flex-1'>
                    {downloadProgress.text}
                  </span>
                </div>
                <span className='text-[11px] font-black text-blue-600 dark:text-blue-400 tabular-nums shrink-0 pt-0.5'>
                  {Math.round(normalizedProgress * 100)}%
                </span>
              </div>
              <Progress value={normalizedProgress} max={1} />
            </div>
            <TextButton onClick={onStopDownload} variant={TextButtonVariant.DANGER}>
              {t('ui.cancel_operation')}
            </TextButton>
          </div>
        )}
      </div>
    </Card>
  );
};
