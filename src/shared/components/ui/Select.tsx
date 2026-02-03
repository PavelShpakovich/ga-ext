import React from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  groups,
  placeholder,
  disabled = false,
  className = '',
  title,
}) => {
  return (
    <div className='relative w-full'>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        title={title}
        className={clsx(
          'w-full pl-4 pr-10 py-2.5',
          'bg-white dark:bg-slate-900',
          'border border-slate-200 dark:border-slate-700/80',
          'rounded-2xl',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500',
          'transition-all',
          'dark:text-slate-100',
          'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          'text-[13px] font-medium appearance-none',
          className,
        )}
      >
        {placeholder && !value && <option value=''>{placeholder}</option>}

        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}

        {groups?.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none' />
    </div>
  );
};
