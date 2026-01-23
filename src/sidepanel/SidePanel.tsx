import React, { useEffect, useState } from 'react';

const SidePanel: React.FC = () => {
  const [text, setText] = useState('');

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
            <div className='bg-white dark:bg-gray-800 rounded-lg p-4 shadow'>
              <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>Selected Text</h3>
              <p className='text-gray-900 dark:text-gray-100'>{text}</p>
            </div>

            <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
              <p className='text-sm text-blue-800 dark:text-blue-300'>
                ✨ AI correction will appear here once we integrate the AI provider
              </p>
            </div>
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
