/**
 * @file useClickOutside.js
 * @description Outside Click Detector Custom Hook.
 * Listens for global DOM mousedown events and triggers a callback when user clicks outside a specified container element.
 * Essential for auto-closing dropdowns, popovers, and floating menus.
 *
 * @module hooks/useClickOutside
 */

import { useEffect } from 'react';

/**
 * Fires the callback when a pointer mousedown event is detected outside the referenced DOM element.
 * @param {React.RefObject} ref - React ref object attached to target container.
 * @param {Function} callback - Function invoked when click occurs outside container bounds.
 */
export function useClickOutside(ref, callback) {
  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}
