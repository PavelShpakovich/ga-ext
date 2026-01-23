import React, { useState } from 'react';
import { Button } from '../Button';
import { CorrectionResult } from '../../types';
import { Check, Copy, RefreshCw } from 'lucide-react';

interface CorrectionActionsProps {
  correctionResult: CorrectionResult;
}

export const CorrectionActions: React.FC<CorrectionActionsProps> = ({ correctionResult }) => {
  const [copied, setCopied] = useState(false);

  const handleReplace = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'replaceText',
        text: correctionResult.corrected,
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(correctionResult.corrected);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className='mt-4 flex gap-2'>
      <Button variant='primary' onClick={handleReplace} className='flex-1 flex items-center justify-center gap-2'>
        <RefreshCw className='w-4 h-4' />
        Replace Text
      </Button>
      <Button variant='secondary' onClick={handleCopy} className='flex items-center justify-center gap-2 min-w-[100px]'>
        {copied ? <Check className='w-4 h-4 text-green-500' /> : <Copy className='w-4 h-4' />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
};
