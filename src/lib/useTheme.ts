import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { getInitialTheme } from './studio';

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  const toggleTheme = useCallback(() => {
    const next = theme === 'day' ? 'night' : 'day';
    const change = () => {
      setTheme(next);
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next === 'night' ? 'dark' : 'light';
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', next === 'night' ? '#1b2430' : '#f4efdf');
      try {
        localStorage.setItem('art-archive-theme', next);
      } catch {
        /* Theme still works in memory. */
      }
    };
    const doc = document as Document & { startViewTransition?: (callback: () => void) => unknown };
    if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      doc.startViewTransition(() => flushSync(change));
    else change();
  }, [theme]);
  return { theme, toggleTheme };
}
