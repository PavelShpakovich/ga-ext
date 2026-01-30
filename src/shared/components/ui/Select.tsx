import React from 'react';

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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      title={title}
      className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 transition-all dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-[13px] font-medium appearance-none ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
        backgroundSize: '1rem',
      }}
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
  );
};
