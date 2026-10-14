/**
 * @file AppRoutes.jsx
 * @description Application Routing Architecture with React Lazy Loading & Code Splitting.
 * Routes are lazily imported to split JavaScript bundles per feature page, reducing initial bundle size
 * and optimizing page load speeds while providing a custom fallback Loader.
 *
 * @module routes/AppRoutes
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/common/Loader/Loader';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// ─── Lazily Loaded Feature Pages (Code Splitting) ─────────────────────────────

// Public Features
const LandingPage = lazy(() => import('../features/auth/pages/LandingPage'));

// Shared Authenticated Features
const ChangePasswordPage = lazy(() => import('../features/auth/pages/ChangePasswordPage'));
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage'));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const MyLeavesPage = lazy(() => import('../features/leave/pages/MyLeavesPage'));

// Manager Features
const TeamLeavesPage = lazy(() => import('../features/leave/pages/TeamLeavesPage'));
const TeamPage = lazy(() => import('../features/employee/pages/TeamPage'));

// HR Features
const AllLeavesPage = lazy(() => import('../features/leave/pages/AllLeavesPage'));
const EmployeesPage = lazy(() => import('../features/employee/pages/EmployeesPage'));
const LeaveTypesPage = lazy(() => import('../features/master/pages/LeaveTypesPage'));
const HolidaysPage = lazy(() => import('../features/holiday/pages/HolidaysPage'));
const DepartmentsPage = lazy(() => import('../features/master/pages/DepartmentsPage'));
const GradesPage = lazy(() => import('../features/master/pages/GradesPage'));
const JobTitlesPage = lazy(() => import('../features/master/pages/JobTitlesPage'));
const GradeJobTitlesPage = lazy(() => import('../features/master/pages/GradeJobTitlesPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader fullscreen text="Loading page..." />}>
      <Routes>
        {/* ── Public Routes ── */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          {/* /login redirects back to home — login is handled via modal */}
          <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.HOME} replace />} />
        </Route>

        {/* ── Protected Authenticated Routes ── */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Shared Authenticated Routes */}
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />

          {/* Employee Routes */}
          <Route path={ROUTES.MY_LEAVES} element={<MyLeavesPage />} />

          {/* Manager & HR Routes */}
          <Route
            path={ROUTES.TEAM_LEAVES}
            element={
              <RoleRoute roles={[ROLES.MANAGER, ROLES.HR]}>
                <TeamLeavesPage />
              </RoleRoute>
            }
          />
          <Route
            path={ROUTES.TEAM}
            element={
              <RoleRoute roles={[ROLES.MANAGER, ROLES.HR]}>
                <TeamPage />
              </RoleRoute>
            }
          />

          {/* HR Only Routes */}
          <Route
            path={ROUTES.LEAVE_REQUESTS}
            element={<RoleRoute roles={[ROLES.HR]}><AllLeavesPage /></RoleRoute>}
          />
          <Route
            path={ROUTES.EMPLOYEES}
            element={<RoleRoute roles={[ROLES.HR]}><EmployeesPage /></RoleRoute>}
          />
          <Route
            path={ROUTES.LEAVE_TYPES}
            element={<RoleRoute roles={[ROLES.HR]}><LeaveTypesPage /></RoleRoute>}
          />
          <Route
            path={ROUTES.HOLIDAYS}
            element={<RoleRoute roles={[ROLES.HR]}><HolidaysPage /></RoleRoute>}
          />
          <Route
            path={ROUTES.DEPARTMENTS}
            element={<RoleRoute roles={[ROLES.HR]}><DepartmentsPage /></RoleRoute>}
          />
          <Route
            path={ROUTES.GRADES}
            element={<RoleRoute roles={[ROLES.HR]}><GradesPage /></RoleRoute>}
          />
          <Route
            path={ROUTES.JOB_TITLES}
            element={<RoleRoute roles={[ROLES.HR]}><JobTitlesPage /></RoleRoute>}
          />
          <Route
            path={ROUTES.GRADE_JOB_TITLES}
            element={<RoleRoute roles={[ROLES.HR]}><GradeJobTitlesPage /></RoleRoute>}
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
