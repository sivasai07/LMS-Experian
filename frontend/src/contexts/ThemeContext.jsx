/**
 * @file ThemeContext.jsx
 * @description Theme State & Mode Manager Context Provider.
 * Synchronizes 'data-theme' attribute on the HTML root element (`<html data-theme="dark">`)
 * with localStorage persistence to support dynamic Light and Dark mode rendering.
 *
 * @module contexts/ThemeContext
 */

import { createContext, useCallback, useEffect, useState } from 'react';
import { THEMES, DEFAULT_THEME } from '../constants/themes';
import { storage } from '../utils/storage';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => storage.getTheme() || DEFAULT_THEME);

  /**
   * Side effect: Applies `data-theme` attribute on document root element for CSS variables mapping
   * and persists current theme mode to localStorage.
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    storage.setTheme(theme);
  }, [theme]);

  /** Toggles active theme between Light and Dark mode. */
  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  }, []);

  /** Explicitly sets theme mode with validation. */
  const setTheme = useCallback((t) => {
    if (Object.values(THEMES).includes(t)) setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === THEMES.DARK }}>
      {children}
    </ThemeContext.Provider>
  );
}
