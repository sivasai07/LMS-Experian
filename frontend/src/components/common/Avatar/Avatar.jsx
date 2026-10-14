/**
 * @file Avatar.jsx
 * @description User Profile Avatar Component.
 * Displays user profile image with fallback to dynamically computed name initials (`getInitials(name)`)
 * upon broken image links or missing photo URLs.
 *
 * @module components/common/Avatar
 */

import { useState, useEffect } from 'react';
import { getInitials } from '../../../utils/helpers';
import './Avatar.css';

/**
 * Reusable User Avatar Component.
 * @param {Object} props - Avatar properties.
 * @param {string} [props.name] - User full name used to extract initials fallback.
 * @param {string} [props.src] - User profile image URL.
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Avatar container sizing.
 * @param {string} [props.className=''] - Additional custom CSS class names.
 */
export default function Avatar({ name, src, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);
  const classes = ['avatar', `avatar-${size}`, className].filter(Boolean).join(' ');

  // Reset image error state whenever image src property changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  return (
    <div className={classes}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          className="avatar-img"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="avatar-initials">{getInitials(name)}</span>
      )}
    </div>
  );
}
