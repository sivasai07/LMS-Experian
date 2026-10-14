/**
 * @file Search.jsx
 * @description Real-time Search Filter Bar Component.
 * Features an integrated search magnifying glass icon, real-time input callback, and quick clear ('x') button.
 *
 * @module components/common/Search
 */

import { RiSearchLine, RiCloseLine } from 'react-icons/ri';
import './Search.css';

/**
 * Reusable Search Input Component.
 * @param {Object} props - Search component properties.
 * @param {string} props.value - Active search text query value.
 * @param {Function} props.onChange - Input change event handler.
 * @param {string} [props.placeholder='Search...'] - Input placeholder text.
 * @param {Function} [props.onClear] - Optional clear search handler.
 * @param {string} [props.className=''] - Additional custom CSS class names.
 */
export default function Search({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
}) {
  const handleClear = () => {
    if (onClear) onClear();
    else onChange({ target: { value: '' } });
  };

  return (
    <div className={`search-box ${className}`}>
      <RiSearchLine className="search-icon" />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-label="Search"
      />
      {value && (
        <button className="search-clear" onClick={handleClear} aria-label="Clear search">
          <RiCloseLine />
        </button>
      )}
    </div>
  );
}
