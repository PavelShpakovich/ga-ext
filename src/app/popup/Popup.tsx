import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { Button, ButtonVariant } from '@/shared/components/Button';
import { Alert, AlertVariant } from '@/shared/components/ui/Alert';
import { Badge, BadgeVariant } from '@/shared/components/ui/Badge';
import { isWebGPUAvailable } from '@/shared/utils/helpers';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/hooks/useTheme';

const Popup: React.FC = () => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [hasWebGPU, setHasWebGPU] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const iconSrc = chrome.runtime.getURL(`icons/icon128${resolvedTheme === 'light' ? '-light' : ''}.png`);

  useEffect(() => {
    isWebGPUAvailable().then(setHasWebGPU);
  }, []);

  const handleLaunchAssistant = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Special case: restricted pages (like chrome:// settings) where content scripts can't run
      const isRestricted = !tab?.id || tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://');

      if (isRestricted) {
        chrome.runtime.sendMessage({ action: 'openSidePanel' }, () => {
          window.close();
        });
        return;
      }

      // Request selected text from content script
      chrome.tabs.sendMessage(tab.id!, { action: 'getSelectedText' }, (response) => {
        // Fallback: If no response or error, just open the panel normally
        if (chrome.runtime.lastError || !response) {
          chrome.runtime.sendMessage({ action: 'openSidePanel' }, () => {
            window.close();
          });
        } else {
          // Open side panel with text context
          chrome.runtime.sendMessage(
            {
              action: 'openSidePanel',
              text: response.text || '',
              autoRun: !!response.text,
            },
            () => {
              window.close();
            },
          );
        }
      });
    } catch (error) {
      // Final fallback for any error
      chrome.runtime.sendMessage({ action: 'openSidePanel' }, () => {
        window.close();
      });
    }
  }, []);

  return (
    <div className='w-90 flex flex-col bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-50 font-sans overflow-hidden'>
      <div className='absolute top-0 left-0 w-full h-32 bg-linear-to-br from-blue-600/10 to-indigo-600/5 dark:from-blue-500/10 dark:to-transparent -z-10' />

      <header className='px-5 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-2.5'>
          <div className='w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/10 border border-white dark:border-slate-800 transition-all'>
            <img src={iconSrc} alt='Icon' className='w-full h-full object-contain rounded-lg' />
          </div>
          <div>
            <h1 className='text-[15px] font-bold tracking-tight text-slate-800 dark:text-white leading-none'>
              {t('ui.title')}
            </h1>
            <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium'>
              {t('popup.local_session')}
            </p>
          </div>
        </div>
        <Badge
          variant={hasWebGPU ? BadgeVariant.SUCCESS : BadgeVariant.DANGER}
          className='text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border-0'
        >
          {hasWebGPU ? t('popup.webgpu') : 'No GPU'}
        </Badge>
      </header>

      <main className='px-5 pb-6 space-y-5 relative'>
        {!hasWebGPU && (
          <Alert
            variant={AlertVariant.ERROR}
            className='rounded-xl border-rose-100 dark:border-rose-900/30 text-[12px]'
          >
            {t('messages.webgpu_not_available')}
          </Alert>
        )}

        <div className='bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/50 p-4 rounded-2xl shadow-sm space-y-3'>
          <div className='flex items-start gap-3'>
            <div className='w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5'>
              <ShieldCheck className='w-4.5 h-4.5 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <h3 className='text-[12px] font-bold text-slate-800 dark:text-slate-200 mb-0.5'>
                {t('popup.privacy_title')}
              </h3>
              <p className='text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed'>
                {t('popup.privacy_description')}
              </p>
            </div>
          </div>

          <div className='h-px bg-slate-200/50 dark:bg-slate-700/30' />

          <div className='flex items-start gap-3'>
            <div className='w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5'>
              <Zap className='w-4.5 h-4.5 text-amber-600 dark:text-amber-400' />
            </div>
            <div>
              <h3 className='text-[12px] font-bold text-slate-800 dark:text-slate-200 mb-0.5'>
                {t('popup.speed_title')}
              </h3>
              <p className='text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed'>
                {t('popup.speed_description')}
              </p>
            </div>
          </div>
        </div>

        <div className='pt-1'>
          <Button
            onClick={handleLaunchAssistant}
            disabled={!hasWebGPU || isLoading}
            className='w-full'
            variant={ButtonVariant.PRIMARY}
          >
            <Sparkles className={isLoading ? 'w-4 h-4 animate-pulse' : 'w-4 h-4'} />
            {t('popup.launch')}
          </Button>
        </div>
      </main>

      <footer className='px-5 py-3.5 bg-white dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5'>
        <ShieldCheck className='w-3 h-3 text-emerald-500/70' />
        <p className='text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-tight'>
          {t('messages.privacy_note')}
        </p>
      </footer>
    </div>
  );
};

export default Popup;
