/**
 * Centralized theme constants for consistent styling across the app
 * Reduces duplicate Tailwind class strings and provides a single source of truth
 */

export const THEME = {
  // Badge variants with dark mode support
  badge: {
    success:
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-200',
    warning:
      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-200',
  },

  // Icon colors matching badges
  icon: {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  },

  // Animation utilities
  animation: {
    transition: 'transition-all duration-300',
    fadeIn: 'animate-in fade-in duration-500',
    slideIn: 'animate-in slide-in-from-bottom-2',
    spinnerLoad: 'animate-spin',
  },

  // Spacing utilities
  spacing: {
    card: 'p-4',
    section: 'px-0.5',
    section_vertical: 'py-3',
    container: 'px-6',
  },

  // Border and shadow utilities
  border: {
    light: 'border-slate-200 dark:border-slate-700',
    card: 'border-gray-200 dark:border-gray-800',
    input: 'border-slate-200 dark:border-slate-700/80',
  },

  shadow: {
    card: 'shadow-sm',
    modal: 'shadow-2xl',
    dropdown: 'shadow-2xl',
  },

  // Background colors
  background: {
    card: 'bg-white dark:bg-gray-850',
    input: 'bg-white dark:bg-slate-900',
    hover: 'hover:bg-slate-50 dark:hover:bg-slate-800',
  },

  // Text utilities
  text: {
    label: 'text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight',
    caption: 'text-[10px] font-semibold text-slate-500 dark:text-slate-400',
    error: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
  },

  // Component base styles
  components: {
    card: 'bg-white dark:bg-gray-850 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 transition-all duration-300',
    input: 'w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl',
    button:
      'rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    modal:
      'bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800',
  },
} as const;
