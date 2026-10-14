/**
 * @file useTheme.js
 * @description Theme Context Consumer Hook.
 * Exposes active UI theme mode ('light' | 'dark') and theme toggle function from ThemeContext.
 * Asserts provider context existence at runtime.
 *
 * @module hooks/useTheme
 */

import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Hook — Access active theme state and theme switching methods.
 * @throws {Error} If consumed outside of ThemeProvider context hierarchy.
 * @returns {{ theme: string, isDark: boolean, toggleTheme: Function, setTheme: Function }} Theme context value.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
