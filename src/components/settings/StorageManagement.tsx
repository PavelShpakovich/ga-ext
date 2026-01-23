import React from 'react';
import { Trash2, CheckCircle, Database } from 'lucide-react';
import { Section, Divider } from '../ui';
import { Button } from '../Button';

interface StorageManagementProps {
  cacheSize: string;
  isClearing: boolean;
  clearSuccess: boolean;
  onClearCache: () => void;
}

export const StorageManagement: React.FC<StorageManagementProps> = ({
  cacheSize,
  isClearing,
  clearSuccess,
  onClearCache,
}) => {
  return (
    <>
      <Divider className='my-4' />
      <Section
        title={
          <div className='flex items-center gap-2'>
            <Database className='w-4 h-4' />
            Storage Management
          </div>
        }
      >
        <div className='space-y-2'>
          <div className='text-xs text-gray-600 dark:text-gray-400'>
            <strong>Cache size:</strong> {cacheSize}
          </div>
          <Button
            variant='secondary'
            size='sm'
            onClick={onClearCache}
            disabled={isClearing}
            className='w-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center gap-2'
          >
            <Trash2 className='w-4 h-4' />
            {isClearing ? 'Clearing...' : 'Clear Cached Models'}
          </Button>
          {clearSuccess && (
            <div className='flex items-center gap-2 text-xs text-green-600 dark:text-green-400'>
              <CheckCircle className='w-3.5 h-3.5' />
              Cache cleared successfully
            </div>
          )}
        </div>
      </Section>
    </>
  );
};
