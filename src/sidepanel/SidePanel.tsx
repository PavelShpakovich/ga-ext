import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StyleSelector } from '../components/StyleSelector';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CorrectionStyle } from '../types';

const SidePanel: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<CorrectionStyle>(CorrectionStyle.FORMAL);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for pending text from background script
    chrome.storage.local.get(['pendingText'], (result) => {
      if (result.pendingText) {
        setText(result.pendingText);
        // Clear pending text
        chrome.storage.local.remove(['pendingText']);
      }
    });

    // Listen for new text selections
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.pendingText?.newValue) {
        setText(changes.pendingText.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return (
    <div className='h-screen flex flex-col bg-gray-50 dark:bg-gray-900'>
      <header className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4'>
        <h1 className='text-lg font-bold text-gray-900 dark:text-gray-100'>Grammar Assistant</h1>
        <p className='text-sm text-gray-500 dark:text-gray-400'>AI-powered grammar correction</p>
      </header>

      <main className='flex-1 overflow-y-auto p-4'>
        {text ? (
          <div className='space-y-4'>
            {/* Original Text */}
            <Card title='Original Text'>
              <p className='text-gray-900 dark:text-gray-100 whitespace-pre-wrap'>{text}</p>
            </Card>

            {/* Style Selector */}
            <Card>
              <StyleSelector
                selected={selectedStyle}
                onChange={setSelectedStyle}
                onRecheck={() => {
                  setIsLoading(true);
                  // TODO: Trigger AI correction
                  setTimeout(() => setIsLoading(false), 1000);
                }}
                disabled={isLoading}
              />
            </Card>

            {/* Loading State */}
            {isLoading && (
              <Card>
                <div className='flex items-center justify-center py-8'>
                  <LoadingSpinner size='lg' />
                  <span className='ml-3 text-gray-600 dark:text-gray-400'>Analyzing your text...</span>
                </div>
              </Card>
            )}

            {/* Placeholder for corrections */}
            {!isLoading && (
              <Card title='Corrected Text'>
                <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
                  <p className='text-sm text-blue-800 dark:text-blue-300'>
                    ✨ AI correction will appear here once we integrate the AI provider
                  </p>
                </div>
                <div className='mt-4 flex gap-2'>
                  <Button variant='primary' disabled>
                    Replace Text
                  </Button>
                  <Button variant='secondary' disabled>
                    Copy
                  </Button>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center text-gray-500 dark:text-gray-400'>
              <svg
                className='w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              <p className='text-sm'>Select text on any page</p>
              <p className='text-xs mt-2'>Right-click → "Correct with Grammar Assistant"</p>
              <p className='text-xs mt-1'>
                or press <kbd className='px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs'>Cmd/Ctrl+Shift+E</kbd>
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className='bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3'>
        <p className='text-xs text-center text-gray-500 dark:text-gray-400'>Grammar Assistant v0.1.0 - Privacy First</p>
      </footer>
    </div>
  );
};

export default SidePanel;
