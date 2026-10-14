/**
 * @file Loader.jsx
 * @description Experian Brand Logo Animated Loader & Inline Spinner Components.
 * Renders the iconic Experian 'e' and colorful orbiting mosaic tiles (Light Blue, Magenta,
 * Raspberry, Violet, Purple) with smooth micro-animations.
 *
 * @module components/common/Loader
 */

import './Loader.css';

/**
 * Animated custom loader featuring the Experian 'e' brand identity and orbiting mosaic tiles.
 * @param {Object} props
 * @param {boolean} [props.fullscreen=false] - Renders fullscreen view overlay.
 * @param {string} [props.text='Loading...'] - Caption text rendered beneath loader.
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Loader dimensions.
 */
export default function Loader({ fullscreen = false, text = 'Loading...', size = 'md' }) {
  return (
    <div className={`loader-screen ${fullscreen ? 'fullscreen' : ''} loader-size-${size}`}>
      <div className="experian-loader" role="status" aria-label="Loading">
        <svg
          viewBox="0 0 100 100"
          className="experian-loader-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top tile: Experian Light Blue */}
          <rect
            className="exp-tile exp-tile-top"
            x="42"
            y="5"
            width="26"
            height="24"
            rx="7"
          />
          {/* Top-right tile: Experian Magenta */}
          <rect
            className="exp-tile exp-tile-tr"
            x="78"
            y="16"
            width="16"
            height="15"
            rx="5"
          />
          {/* Large Left tile: Experian Purple */}
          <rect
            className="exp-tile exp-tile-left"
            x="5"
            y="23"
            width="30"
            height="28"
            rx="8"
          />
          {/* Bottom-left tile: Experian Plum / Violet */}
          <rect
            className="exp-tile exp-tile-bl"
            x="13"
            y="58"
            width="18"
            height="17"
            rx="5"
          />
          {/* Bottom tile: Experian Raspberry */}
          <rect
            className="exp-tile exp-tile-bottom"
            x="34"
            y="79"
            width="22"
            height="20"
            rx="6"
          />

          {/* Central Experian 'e' */}
          <path
            className="exp-letter-e"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 44.5 53.5 H 83 C 83 40.5 74.5 32 63.5 32 C 50.5 32 41 42 41 55 C 41 68 50.5 78 63.5 78 C 73.5 78 80.5 72.5 83.5 64.5 L 76.5 60.5 C 74.5 66 69.5 70.5 63.5 70.5 C 54.5 70.5 48.5 63.5 48.5 54.5 H 83 C 83 54 83 53.5 83 53.5 Z M 48.5 46.5 C 49.5 40.5 55.5 38.5 63.5 38.5 C 71.5 38.5 75.5 42 76.5 46.5 H 48.5 Z"
          />
        </svg>
      </div>
      {text && <span className="loader-text">{text}</span>}
    </div>
  );
}

/**
 * Reusable inline spinner for buttons and inline async indicators.
 */
export function SpinnerInline() {
  return (
    <span className="spinner-inline" aria-label="Loading">
      <svg
        viewBox="0 0 100 100"
        className="spinner-inline-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect className="exp-tile exp-tile-top" x="42" y="5" width="26" height="24" rx="7" />
        <rect className="exp-tile exp-tile-tr" x="78" y="16" width="16" height="15" rx="5" />
        <rect className="exp-tile exp-tile-left" x="5" y="23" width="30" height="28" rx="8" />
        <rect className="exp-tile exp-tile-bl" x="13" y="58" width="18" height="17" rx="5" />
        <rect className="exp-tile exp-tile-bottom" x="34" y="79" width="22" height="20" rx="6" />
        <path
          className="exp-letter-e"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 44.5 53.5 H 83 C 83 40.5 74.5 32 63.5 32 C 50.5 32 41 42 41 55 C 41 68 50.5 78 63.5 78 C 73.5 78 80.5 72.5 83.5 64.5 L 76.5 60.5 C 74.5 66 69.5 70.5 63.5 70.5 C 54.5 70.5 48.5 63.5 48.5 54.5 H 83 C 83 54 83 53.5 83 53.5 Z M 48.5 46.5 C 49.5 40.5 55.5 38.5 63.5 38.5 C 71.5 38.5 75.5 42 76.5 46.5 H 48.5 Z"
        />
      </svg>
    </span>
  );
}
