import React, { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { Card } from '../components/Card';
import { StyleSelector } from '../components/StyleSelector';
import { CorrectionStyle, CorrectionResult } from '../types';
import { useAI } from '../hooks/useAI';
import { useDownloadProgress } from '../hooks/useDownloadProgress';
import { usePendingText } from '../hooks/usePendingText';
import { useSettings } from '../hooks/useSettings';
import { useModelSelection } from '../hooks/useModelSelection';
import { EmptyState, Kbd, Badge } from '../components/ui';
import { DownloadStatus } from '../components/correction/DownloadStatus';
import { ProcessingStatus } from '../components/correction/ProcessingStatus';
import { ErrorDisplay } from '../components/correction/ErrorDisplay';
import { CorrectionActions } from '../components/correction/CorrectionActions';
import { ChangesList } from '../components/correction/ChangesList';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Logger } from '../services';

const SidePanelContent: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<CorrectionStyle>(CorrectionStyle.FORMAL);
  const [correctionResult, setCorrectionResult] = useState<CorrectionResult | null>(null);

  const { correct, isLoading, error } = useAI();
  const { downloadProgress, stopDownload } = useDownloadProgress();
  const { settings } = useSettings();
  const { getModelInfo } = useModelSelection();

  const selectedModelInfo = getModelInfo(settings.selectedModel);
  const modelSize = selectedModelInfo?.size;

  const triggerCorrection = useCallback(
    async (textToCorrect: string, style: CorrectionStyle) => {
      try {
        Logger.debug('SidePanel', 'Triggering correction', { length: textToCorrect.length, style });
        const result = await correct(textToCorrect, style);
        setCorrectionResult(result);
      } catch (err) {
        Logger.error('SidePanel', 'Correction failed', err);
      }
    },
    [correct],
  );

  const handleStyleChange = useCallback(
    (style: CorrectionStyle) => {
      setSelectedStyle(style);
      if (text) {
        triggerCorrection(text, style);
      }
    },
    [text, triggerCorrection],
  );

  const handleRecheck = useCallback(() => {
    if (text) {
      triggerCorrection(text, selectedStyle);
    }
  }, [text, selectedStyle, triggerCorrection]);

  usePendingText(
    useCallback(
      (newText: string) => {
        setText(newText);
        triggerCorrection(newText, selectedStyle);
      },
      [selectedStyle, triggerCorrection],
    ),
  );

  return (
    <div className='h-screen flex flex-col bg-gray-50 dark:bg-gray-900'>
      <header className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4'>
        <div className='flex items-center gap-2'>
          <FileText className='w-5 h-5 text-blue-600 dark:text-blue-400' />
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <h1 className='text-lg font-bold text-gray-900 dark:text-gray-100 leading-none'>Grammar Assistant</h1>
              <Badge variant='success' className='text-[10px] px-1.5 py-0'>
                Local AI
              </Badge>
            </div>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Privacy-first correction</p>
          </div>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto p-4'>
        {text ? (
          <div className='space-y-4'>
            <Card title='Original Text'>
              <p className='text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-thin text-sm'>
                {text}
              </p>
            </Card>

            <Card>
              <StyleSelector
                selected={selectedStyle}
                onChange={handleStyleChange}
                onRecheck={handleRecheck}
                disabled={isLoading}
              />
            </Card>

            {error && !isLoading && (
              <Card>
                <ErrorDisplay error={error} />
              </Card>
            )}

            {isLoading && (
              <Card>
                <div className='flex flex-col items-center justify-center py-8'>
                  {downloadProgress ? (
                    <DownloadStatus progress={downloadProgress} onStop={stopDownload} modelSize={modelSize} />
                  ) : (
                    <ProcessingStatus />
                  )}
                </div>
              </Card>
            )}

            {correctionResult && !isLoading && !error && (
              <div className='space-y-4 animate-fade-in-up'>
                <Card title='Corrected Text' badge={<Badge variant='primary'>{correctionResult.style}</Badge>}>
                  <div className='p-3 bg-green-50/50 dark:bg-green-900/10 rounded-md border border-green-100 dark:border-green-800/30'>
                    <p className='text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-medium'>
                      {correctionResult.corrected}
                    </p>
                  </div>
                  <CorrectionActions correctionResult={correctionResult} />
                </Card>

                {correctionResult.summary && (
                  <Card title='Summary'>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>{correctionResult.summary}</p>
                  </Card>
                )}

                <ChangesList changes={correctionResult.changes} />
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className='w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600' />}
            title='Select text on any page'
            description={[
              'Right-click → "Correct with Grammar Assistant"',
              <>
                or press <Kbd>Cmd/Ctrl+Shift+E</Kbd>
              </>,
            ]}
          />
        )}
      </main>

      <footer className='bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3'>
        <p className='text-xs text-center text-gray-500 dark:text-gray-400'>Grammar Assistant v0.1.0 - Privacy First</p>
      </footer>
    </div>
  );
};

const SidePanel: React.FC = () => {
  return (
    <ErrorBoundary>
      <SidePanelContent />
    </ErrorBoundary>
  );
};

export default SidePanel;
