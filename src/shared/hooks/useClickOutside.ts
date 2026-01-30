import { useEffect, RefObject } from 'react';

/**
 * Custom hook that triggers a callback when a click is detected outside of the referenced element.
 *
 * @param ref - React ref of the element to monitor for outside clicks
 * @param handler - Callback function to trigger on outside click
 * @param enabled - Boolean to enable/disable the event listener (default: true)
 */
export const useClickOutside = (
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  enabled: boolean = true,
): void => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      handler();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler, enabled]);
};
