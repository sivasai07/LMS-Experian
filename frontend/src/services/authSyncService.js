/**
 * authSyncService — Cross-tab authentication synchronization.
 *
 * Uses BroadcastChannel API (modern browsers) with a localStorage
 * storage-event fallback for broader compatibility.
 *
 * Events broadcast:
 *   AUTH_LOGIN   — user authenticated in another tab
 *   AUTH_LOGOUT  — user logged out in another tab
 *   AUTH_TOKEN   — token was refreshed/changed
 */

const CHANNEL_NAME = 'lms_auth_sync';
const STORAGE_EVENT_KEY = 'lms_auth_event';

const EVENT = {
  LOGIN: 'AUTH_LOGIN',
  LOGOUT: 'AUTH_LOGOUT',
  TOKEN_CHANGED: 'AUTH_TOKEN',
};

class AuthSyncService {
  constructor() {
    this._channel = null;
    this._listeners = new Set();
    this._ownTabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this._init();
  }

  _init() {
    // BroadcastChannel — preferred (no storage writes needed)
    if (typeof BroadcastChannel !== 'undefined') {
      this._channel = new BroadcastChannel(CHANNEL_NAME);
      this._channel.onmessage = (ev) => {
        if (ev.data?.tabId !== this._ownTabId) {
          this._notify(ev.data);
        }
      };
    }

    // storage event fallback (also works across browsers that support BroadcastChannel
    // as an additional safety net)
    window.addEventListener('storage', (ev) => {
      if (ev.key === STORAGE_EVENT_KEY && ev.newValue) {
        try {
          const payload = JSON.parse(ev.newValue);
          if (payload.tabId !== this._ownTabId) {
            this._notify(payload);
          }
        } catch { /* malformed */ }
      }
    });
  }

  _notify(payload) {
    this._listeners.forEach((cb) => {
      try { cb(payload); } catch { /* never crash listeners */ }
    });
  }

  /**
   * Broadcast an auth event to all other open tabs.
   * @param {string} type  One of EVENT.*
   * @param {object} [extra]  Additional payload
   */
  broadcast(type, extra = {}) {
    const payload = { type, tabId: this._ownTabId, ts: Date.now(), ...extra };

    if (this._channel) {
      this._channel.postMessage(payload);
    }

    // Always write to localStorage for the storage-event fallback
    try {
      localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(payload));
      // Immediately remove so next event triggers change again
      setTimeout(() => localStorage.removeItem(STORAGE_EVENT_KEY), 100);
    } catch { /* quota exceeded or private mode */ }
  }

  /**
   * Register a listener that fires when another tab broadcasts an event.
   * Returns an unsubscribe function.
   * @param {(payload: {type: string}) => void} cb
   * @returns {() => void}
   */
  subscribe(cb) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  broadcastLogin() { this.broadcast(EVENT.LOGIN); }
  broadcastLogout() { this.broadcast(EVENT.LOGOUT); }
  broadcastTokenChanged() { this.broadcast(EVENT.TOKEN_CHANGED); }
}

export const authSyncService = new AuthSyncService();
export { EVENT as AUTH_SYNC_EVENT };
