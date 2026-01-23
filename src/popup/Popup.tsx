import React from 'react';

const Popup: React.FC = () => {
  return (
    <div className='w-80 p-4'>
      <h1 className='text-xl font-bold text-primary-600 mb-2'>Grammar Assistant</h1>
      <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>Privacy-first AI grammar correction</p>
      <div className='space-y-2'>
        <button
          className='w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors'
          onClick={() => {
            chrome.runtime.sendMessage({ action: 'openSidePanel' });
          }}
        >
          Open Correction Panel
        </button>
        <button
          className='w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
          onClick={() => {
            chrome.tabs.create({ url: 'sidepanel.html' });
          }}
        >
          Settings
        </button>
      </div>
      <div className='mt-4 text-xs text-gray-500 dark:text-gray-400'>
        <p>Keyboard shortcut:</p>
        <kbd className='px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded'>Cmd/Ctrl + Shift + E</kbd>
      </div>
    </div>
  );
};

export default Popup;
