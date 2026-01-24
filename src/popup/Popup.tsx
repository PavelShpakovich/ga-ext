import React, { useState, useEffect, useCallback } from 'react';
import { Settings, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { Alert, IconButton, Divider, Kbd, Badge } from '../components/ui';
import { ModelManager } from '../components/settings/ModelManager';
import { StorageManagement } from '../components/settings/StorageManagement';
import { FeaturesList } from '../components/settings/FeaturesList';
import { Button } from '../components/Button';
import { WebLLMProvider } from '../providers/WebLLMProvider';
import { useSettings } from '../hooks/useSettings';
import { useCacheManagement } from '../hooks/useCacheManagement';
import { useModelSelection } from '../hooks/useModelSelection';

const Popup: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [hasWebGPU, setHasWebGPU] = useState(true);

  const { settings, updateSettings } = useSettings();
  const { cacheSize, isClearing, clearSuccess, clearCache } = useCacheManagement();
  const { allModels, selectGroups, getModelInfo } = useModelSelection();

  useEffect(() => {
    WebLLMProvider.isWebGPUAvailable().then(setHasWebGPU);
  }, []);

  const handleModelChange = useCallback(
    (modelId: string) => {
      updateSettings({ selectedModel: modelId });
    },
    [updateSettings],
  );

  const handleOpenPanel = useCallback(() => {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
    window.close(); // Close popup when opening side panel
  }, []);

  const selectedModelInfo = getModelInfo(settings.selectedModel);

  return (
    <div className='w-80 h-[600px] flex flex-col bg-gray-50 dark:bg-gray-900 font-sans text-gray-900'>
      <header className='flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 shrink-0'>
        <div className='flex items-center gap-2'>
          <div className='p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg'>
            <FileText className='w-5 h-5 text-blue-600 dark:text-blue-400' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-base font-bold text-gray-900 dark:text-gray-100 leading-none'>Grammar Assistant</h1>
              <Badge variant='success' className='text-[10px] px-1.5 py-0.5 h-auto'>
                Local AI
              </Badge>
            </div>
          </div>
        </div>
        <IconButton
          icon={<Settings className='w-4 h-4' />}
          onClick={() => setShowSettings(!showSettings)}
          title='Settings'
          variant={showSettings ? 'default' : 'ghost'}
          size='sm'
        />
      </header>

      <main className='flex-1 p-4 overflow-y-auto'>
        {!hasWebGPU && (
          <Alert variant='error' className='mb-4'>
            <div className='text-xs'>
              <strong>WebGPU not available</strong>
              <p className='mt-1 opacity-90'>Enable hardware acceleration in chrome://settings/system</p>
            </div>
          </Alert>
        )}

        {showSettings ? (
          <div className='space-y-4 animate-fade-in-up'>
            <div className='flex items-center justify-between mb-2'>
              <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>Settings</h2>
              <Button variant='ghost' size='sm' onClick={() => setShowSettings(false)} className='text-xs h-7 px-2'>
                Done
              </Button>
            </div>

            <ModelManager
              selectedModel={settings.selectedModel}
              onModelChange={handleModelChange}
              onSettingsClose={() => setShowSettings(false)}
            />

            <StorageManagement
              cacheSize={cacheSize}
              isClearing={isClearing}
              clearSuccess={clearSuccess}
              onClearCache={clearCache}
            />

            <FeaturesList />
          </div>
        ) : (
          <div className='space-y-4 animate-fade-in-up flex flex-col h-full justify-center'>
            <div className='text-center space-y-2 mb-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Ready to write?</h2>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Select text on any webpage and right-click or use the shortcut to start correcting.
              </p>
            </div>

            <Button
              variant='primary'
              onClick={handleOpenPanel}
              className='w-full py-6 text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group'
            >
              Open Side Panel
              <ChevronRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
            </Button>

            <div className='bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm'>
              <div className='flex justify-between items-center text-xs text-gray-500 dark:text-gray-400'>
                <span>Active Model:</span>
                <span className='font-medium text-blue-600 dark:text-blue-400 truncate max-w-37.5'>
                  {selectedModelInfo?.name || settings.selectedModel}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className='shrink-0 p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700'>
        <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
          <div className='flex items-center gap-1.5'>
            <Kbd>Cmd</Kbd> + <Kbd>Shift</Kbd> + <Kbd>E</Kbd>
          </div>
          <span className='opacity-70'>v0.1.0</span>
        </div>
      </footer>
    </div>
  );
};

export default Popup;
