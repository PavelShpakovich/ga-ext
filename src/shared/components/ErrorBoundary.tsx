import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Logger } from '@/core/services/Logger';
import i18n from 'i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error('ErrorBoundary', 'Uncaught error:', { error, errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='flex flex-col items-center justify-center p-6 text-center h-full min-h-50'>
          <div className='text-red-500 mb-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='48'
              height='48'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
          </div>
          <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-2'>{i18n.t('error.something_wrong')}</h2>
          <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
            {this.state.error?.message || i18n.t('error.unexpected')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium'
          >
            {i18n.t('error.reload')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
