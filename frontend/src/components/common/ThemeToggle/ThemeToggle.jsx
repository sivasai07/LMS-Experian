/**
 * @file ThemeToggle.jsx
 * @description Theme Mode Switcher Toggle Button.
 * Toggles between Light and Dark themes via ThemeContext, displaying Sun and Moon icon animations.
 *
 * @module components/common/ThemeToggle
 */

import { RiSunLine, RiMoonLine } from 'react-icons/ri';
import { useTheme } from '../../../hooks/useTheme';
import './ThemeToggle.css';

/**
 * Reusable ThemeToggle Component.
 * @param {Object} props
 * @param {string} [props.className=''] - Additional CSS class names.
 */
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggler-btn ${isDark ? 'is-dark' : 'is-light'} ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="theme-toggle-icon-wrap">
        {isDark ? <RiSunLine className="theme-icon sun" /> : <RiMoonLine className="theme-icon moon" />}
      </div>
    </button>
  );
}
