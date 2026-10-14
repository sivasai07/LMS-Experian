/**
 * @file useAuthSync.js
 * @description Custom React Hook for Cross-Tab Authentication Synchronization.
 * Listens for BroadcastChannel & localStorage storage events emitted across browser tabs/windows.
 * Enables instant session ejection upon sign-out in another tab and automatic session hydration on sign-in.
 *
 * @module hooks/useAuthSync
 */

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authSyncService, AUTH_SYNC_EVENT } from '../services/authSyncService';
import { clearAuth, checkAuthThunk } from '../store/slices/authSlice';
import { storage } from '../utils/storage';
import { ROUTES } from '../constants/routes';

/**
 * Hook — Synchronizes authentication state across sibling browser tabs.
 * - Cross-tab Logout: Ejects tab session, purges local Redux state without re-broadcasting, and redirects to home.
 * - Cross-tab Login: Triggers session re-check to pick up the updated JWT session.
 */
export function useAuthSync() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  
  // Ref tracking current authentication status to prevent duplicate toast emissions across tabs
  const isAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    isAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const unsub = authSyncService.subscribe((payload) => {
      switch (payload.type) {
        case AUTH_SYNC_EVENT.LOGOUT:
          // Synchronize logout across secondary tabs if active
          if (isAuthRef.current) {
            storage.removeToken();
            dispatch(clearAuth());
            navigate(ROUTES.HOME, { replace: true });
            toast('Signed out in another tab.', { icon: '🔒', id: 'cross-tab-logout' });
          }
          break;

        case AUTH_SYNC_EVENT.LOGIN:
          dispatch(checkAuthThunk());
          break;

        case AUTH_SYNC_EVENT.TOKEN_CHANGED:
          dispatch(checkAuthThunk());
          break;

        default:
          break;
      }
    });

    return unsub;
  }, [dispatch, navigate]);
}
