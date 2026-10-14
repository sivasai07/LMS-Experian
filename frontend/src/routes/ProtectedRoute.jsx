/**
 * @file ProtectedRoute.jsx
 * @description Authentication Guard Component for Protected Application Routes.
 * Verifies active session authentication, renders a loader during session checks,
 * redirects unauthenticated users to the login landing page, and enforces mandatory password changes.
 *
 * @module routes/ProtectedRoute
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader/Loader';
import { ROUTES } from '../constants/routes';

/**
 * ProtectedRoute Guard Component.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements/layout to render if authenticated.
 * @returns {React.ReactNode} Rendered route content or redirection component.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Display fullscreen loader while checking JWT session validity
  if (loading) return <Loader fullscreen />;

  // Redirect unauthenticated users to landing page and open login modal
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} state={{ from: location, openLogin: true }} replace />;
  }

  // Force mandatory password change redirect if flag is active on user profile
  if (
    user?.force_password_change &&
    location.pathname !== ROUTES.CHANGE_PASSWORD
  ) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
  }

  return children;
}
