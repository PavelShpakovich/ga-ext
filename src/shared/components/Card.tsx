import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { IconButton, IconButtonVariant, IconButtonSize } from './ui/IconButton';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  badge,
  icon,
  actions,
  collapsible,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsible ? defaultCollapsed : false);

  const toggleCollapse = useCallback(() => {
    if (collapsible) {
      setIsCollapsed((prev) => !prev);
    }
  }, [collapsible]);

  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 transition-all duration-300',
        className,
      )}
    >
      {(title || badge || icon || actions || collapsible) && (
        <div
          className={clsx(
            'flex justify-between items-center px-0.5',
            !isCollapsed && 'mb-3',
            collapsible ? 'cursor-pointer' : 'cursor-default',
          )}
          onClick={collapsible ? toggleCollapse : undefined}
        >
          <div className='flex items-center gap-2.5'>
            {icon && <div className='text-slate-400 dark:text-slate-500'>{icon}</div>}
            {title && (
              <h3 className='text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest'>
                {title}
              </h3>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {badge && isCollapsed && <div className='animate-in fade-in duration-500'>{badge}</div>}
            <div className='flex items-center gap-1'>
              {actions && <div className='flex items-center gap-1'>{actions}</div>}
              {collapsible && (
                <IconButton
                  icon={
                    <ChevronDown
                      size={14}
                      className={clsx('transition-transform duration-300', isCollapsed && '-rotate-90')}
                    />
                  }
                  variant={IconButtonVariant.GHOST}
                  size={IconButtonSize.XS}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapse();
                  }}
                  className='text-slate-400'
                />
              )}
            </div>
          </div>
        </div>
      )}
      <div
        className={clsx(
          'relative transition-all duration-300 overflow-hidden',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100',
        )}
      >
        {children}
      </div>
    </div>
  );
};
