import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Sparkles, Settings2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { Badge } from '@/shared/components/ui/Badge';
import { WebLLMProvider } from '@/core/providers/WebLLMProvider';
import { useTranslation } from 'react-i18next';
import { STORAGE_KEYS } from '@/core/constants';

const Popup: React.FC = () => {
  const { t } = useTranslation();
  const [hasWebGPU, setHasWebGPU] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    WebLLMProvider.isWebGPUAvailable().then(setHasWebGPU);

    // Add a small animation-in class to body if needed,
    // but we can just use tailwind transitions here
  }, []);

  const handleOpenPanel = useCallback(() => {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
    window.close();
  }, []);

  const handleCorrectSelection = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setIsLoading(false);
        return;
      }

      // Request selected text from content script
      chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
        const text = response?.text;

        // Open side panel and trigger auto-run if text exists
        chrome.runtime.sendMessage(
          {
            action: 'openSidePanel',
            text: text || '',
            autoRun: !!text,
          },
          () => {
            window.close();
          },
        );
      });
    } catch (error) {
      console.error('Failed to correct selection:', error);
      setIsLoading(false);
    }
  }, []);

  return (
    <div className='w-[360px] flex flex-col bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-50 font-sans overflow-hidden'>
      {/* Dynamic Background Element */}
      <div className='absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600/10 to-indigo-600/5 dark:from-blue-500/10 dark:to-transparent -z-10' />

      {/* Header */}
      <header className='px-5 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20'>
            <Sparkles className='w-4.5 h-4.5 text-white' />
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
          variant={hasWebGPU ? 'success' : 'danger'}
          className='text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border-0'
        >
          {hasWebGPU ? t('popup.webgpu') : 'No GPU'}
        </Badge>
      </header>

      <main className='px-5 pb-6 space-y-5 relative'>
        {!hasWebGPU && (
          <Alert variant='error' className='rounded-xl border-rose-100 dark:border-rose-900/30 text-[12px]'>
            {t('messages.webgpu_not_available')}
          </Alert>
        )}

        {/* Feature Highlights */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 p-3 rounded-2xl shadow-sm'>
            <div className='w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-2'>
              <ShieldCheck className='w-4 h-4 text-blue-600 dark:text-blue-400' />
            </div>
            <h3 className='text-[11px] font-bold text-slate-800 dark:text-slate-200'>{t('ui.local')}</h3>
            <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight'>100% Private</p>
          </div>
          <div className='bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 p-3 rounded-2xl shadow-sm'>
            <div className='w-7 h-7 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mb-2'>
              <Zap className='w-4 h-4 text-amber-600 dark:text-amber-400' />
            </div>
            <h3 className='text-[11px] font-bold text-slate-800 dark:text-slate-200'>WebGPU</h3>
            <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight'>On-device AI</p>
          </div>
        </div>

        <div className='space-y-3 pt-1'>
          <Button
            onClick={handleCorrectSelection}
            disabled={!hasWebGPU || isLoading}
            className='w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 border-0 group transition-all'
            variant='primary'
          >
            <Sparkles
              className={
                isLoading ? 'w-4 h-4 mr-2 animate-pulse' : 'w-4 h-4 mr-2 group-hover:scale-110 transition-transform'
              }
            />
            <span className='font-bold text-[13px]'>{t('popup.run_ai')}</span>
          </Button>

          <Button
            onClick={handleOpenPanel}
            className='w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group'
            variant='outline'
          >
            <Settings2 className='w-4 h-4 mr-2 text-slate-400 group-hover:text-blue-500 transition-colors' />
            <span className='font-bold text-[13px] text-slate-600 dark:text-slate-300'>{t('popup.open_center')}</span>
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
