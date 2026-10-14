/**
 * @file PublicLayout.jsx
 * @description Public Landing & Login Application Shell Layout.
 * Renders unauthenticated views (Landing page, auth popups) within a clean, standalone container.
 *
 * @module layouts/PublicLayout
 */

import { Outlet } from 'react-router-dom';
import './PublicLayout.css';

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <Outlet />
    </div>
  );
}
