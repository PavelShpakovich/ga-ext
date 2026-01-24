import React, { useCallback, useEffect, useState } from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { WebLLMProvider } from '../providers/WebLLMProvider';

const Popup: React.FC = () => {
  const [hasWebGPU, setHasWebGPU] = useState(true);

  useEffect(() => {
    WebLLMProvider.isWebGPUAvailable().then(setHasWebGPU);
  }, []);

  const handleOpenPanel = useCallback(() => {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
    window.close();
  }, []);

  return (
    <div className='w-[340px] flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40'>
      {/* Header */}
      <header className='px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between'>
        <div className='flex items-center gap-3.5'>
          <div className='p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl'>
            <FileText className='w-5 h-5 text-blue-600 dark:text-blue-400' />
          </div>
          <div className='flex flex-col'>
            <h1 className='text-sm font-bold tracking-tight text-slate-800 dark:text-white'>Assistant</h1>
            <span className='text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold'>
              Local Session
            </span>
          </div>
        </div>
        <Badge variant='success' className='text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest'>
          WebGPU
        </Badge>
      </header>

      <main className='p-6 space-y-6'>
        {!hasWebGPU && (
          <Alert variant='error' className='rounded-2xl'>
            WebGPU not available. Enable hardware acceleration in your browser settings.
          </Alert>
        )}

        <div className='space-y-4'>
          <div className='bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm'>
            <p className='text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed'>
              Enhance your writing with privacy-first AI. Manage models and corrections in the dedicated side panel.
            </p>
            <div className='mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50'>
              <p className='text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.15em]'>
                Experimental local-first AI
              </p>
            </div>
          </div>

          <Button
            onClick={handleOpenPanel}
            className='w-full h-12 rounded-2xl group shadow-lg shadow-blue-500/10'
            variant='primary'
          >
            Open Control Center
            <ArrowRight className='w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5' />
          </Button>
        </div>
      </main>

      <footer className='px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800'>
        <p className='text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium'>
          Privacy First • No Data Sent to Servers
        </p>
      </footer>
    </div>
  );
};

export default Popup;
