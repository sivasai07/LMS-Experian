/**
 * @file AuthSyncListener.jsx
 * @description Cross-Tab Authentication Synchronization Host Component.
 * Mounts the `useAuthSync` custom hook to listen for BroadcastChannel & storage events across sibling browser tabs.
 * Renders nothing (`null`) — acts purely as a side-effect container within the React tree.
 *
 * @module components/auth/AuthSyncListener
 */

import { useAuthSync } from '../../hooks/useAuthSync';

export default function AuthSyncListener() {
  useAuthSync();
  return null;
}
