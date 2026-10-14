/**
 * @file RoleRoute.jsx
 * @description Role-Based Access Control (RBAC) Route Guard Component.
 * Validates user role permissions against a list of authorized roles before rendering protected views.
 *
 * @module routes/RoleRoute
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasRole } from '../utils/permissions';
import { ROUTES } from '../constants/routes';

/**
 * RoleRoute Guard Component.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements/views to render if authorized.
 * @param {Array<string>} props.roles - Array of permitted role names (e.g. ['HR', 'Manager']).
 * @returns {React.ReactNode} Rendered children or fallback dashboard redirection.
 */
export default function RoleRoute({ children, roles = [] }) {
  const { user } = useAuth();

  if (!hasRole(user, roles)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
}
