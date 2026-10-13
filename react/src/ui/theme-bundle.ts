// Theme bundle: the all-in-one Tailwind 3 bundle from
// @syncfusion/ej2-tailwind3-theme is loaded statically in main.tsx. The dark
// variant is the same bundle with the `e-dark-mode` class on <body>.
// No per-control stylesheet is loaded on top.

import { useEffect } from 'react';
import { useApp } from '../application/app-context';

type Theme = 'light' | 'dark';

/** Applies/removes the body-level dark-mode class with the theme. */
export function useThemeBundle(activeTheme: Theme) {
  const { theme } = useApp();
  void theme;
  useEffect(() => {
    document.body.classList.toggle('e-dark-mode', activeTheme === 'dark');
    return () => { if (activeTheme === 'dark') document.body.classList.remove('e-dark-mode'); };
  }, [activeTheme]);
  // The static bundle is resolved by Vite before render; nothing gates the shell.
  return true;
}