/**
 * @file themes.js
 * @description Application UI Theme Tokens & Defaults.
 * Defines supported theme modes (Light and Dark) for ThemeContext persistence.
 *
 * @module constants/themes
 */

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

/** Default theme mode assigned upon first app launch. */
export const DEFAULT_THEME = THEMES.LIGHT;
