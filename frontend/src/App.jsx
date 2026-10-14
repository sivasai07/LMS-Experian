/**
 * @file App.jsx
 * @description Application Root Component & Provider Composition Hierarchy.
 * Mounts BrowserRouter, ThemeProvider, NotificationProvider, Redux auth session initialization,
 * cross-tab authentication sync listener, global CSS styles, and react-hot-toast notifications container.
 *
 * @module App
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { checkAuthThunk } from './store/slices/authSlice';
import AppRoutes from './routes/AppRoutes';
import AuthSyncListener from './components/auth/AuthSyncListener';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import './styles/variables.css';
import './styles/globals.css';
import './styles/themes.css';
import './styles/animations.css';
import './styles/utilities.css';

function AppInner() {
  const dispatch = useDispatch();

  /** Initial session hydration effect: Dispatches checkAuthThunk on app boot. */
  useEffect(() => {
    dispatch(checkAuthThunk());
  }, [dispatch]);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthSyncListener />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
            },
            success: { iconTheme: { primary: 'var(--color-success)', secondary: '#fff' } },
            error:   { iconTheme: { primary: 'var(--color-danger)',  secondary: '#fff' } },
          }}
        />
      </NotificationProvider>
    </ThemeProvider>
  );
}

// BrowserRouter wraps useNavigate calls inside AuthSyncListener and AppRoutes
export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
