import React from 'react';
import { Language } from '@/shared/types';
import { LanguageCompatibilityRegistry, CompatibilityLevel } from '@/core/services/LanguageCompatibility';

interface LanguageCompatibilityBadgeProps {
  modelId: string;
  language: Language;
  showLabel?: boolean;
  className?: string;
}

/**
 * Get Tailwind classes for the compatibility indicator dot
 * Based on compatibility level with light and dark mode variants
 */
function getDotClasses(level: CompatibilityLevel): string {
  const baseClasses = 'w-2 h-2 rounded-full';
  
  switch (level) {
    case CompatibilityLevel.EXCELLENT:
      return `${baseClasses} bg-emerald-500 dark:bg-emerald-400`;
    case CompatibilityLevel.GOOD:
      return `${baseClasses} bg-blue-500 dark:bg-blue-400`;
    case CompatibilityLevel.FAIR:
      return `${baseClasses} bg-amber-500 dark:bg-amber-400`;
    case CompatibilityLevel.LIMITED:
      return `${baseClasses} bg-red-500 dark:bg-red-400`;
    default:
      return `${baseClasses} bg-gray-500 dark:bg-gray-400`;
  }
}

/**
 * Get Tailwind classes for the label badge background and text
 * Provides light and dark mode variants with appropriate contrast
 */
function getLabelClasses(level: CompatibilityLevel): string {
  const baseClasses = 'text-xs font-medium px-2 py-1 rounded';
  
  switch (level) {
    case CompatibilityLevel.EXCELLENT:
      return `${baseClasses} bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200`;
    case CompatibilityLevel.GOOD:
      return `${baseClasses} bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200`;
    case CompatibilityLevel.FAIR:
      return `${baseClasses} bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-200`;
    case CompatibilityLevel.LIMITED:
      return `${baseClasses} bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200`;
    default:
      return `${baseClasses} bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-200`;
  }
}

/**
 * Component for displaying model-language compatibility information
 * Shows a colored indicator dot and optional label badge
 * 
 * @param modelId - ID of the model to check compatibility for
 * @param language - Language to check compatibility with
 * @param showLabel - Whether to display the label badge (default: true)
 * @param className - Additional CSS classes to apply to the container
 */
export const LanguageCompatibilityBadge: React.FC<LanguageCompatibilityBadgeProps> = ({
  modelId,
  language,
  showLabel = true,
  className = '',
}) => {
  const level = LanguageCompatibilityRegistry.getCompatibility(modelId, language);
  const label = LanguageCompatibilityRegistry.getCompatibilityLabel(level);
  const notes = LanguageCompatibilityRegistry.getCompatibilityNotes(modelId, language);

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label={`${label} support`}>
      <div
        className={getDotClasses(level)}
        role="img"
        aria-label={label}
        title={notes || `${label} support for this language`}
      />
      {showLabel && (
        <span
          className={getLabelClasses(level)}
          title={notes}
          aria-describedby={notes ? `compatibility-note-${modelId}-${language}` : undefined}
        >
          {label}
          {notes && <span id={`compatibility-note-${modelId}-${language}`} className="sr-only">{notes}</span>}
        </span>
      )}
    </div>
  );
};

export default LanguageCompatibilityBadge;
