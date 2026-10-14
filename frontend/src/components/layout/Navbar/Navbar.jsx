/**
 * @file Navbar.jsx
 * @description Application Top Navigation Bar & User Profile Dropdown Header.
 * Renders the top app bar displaying user profile summary, avatar, role badge, theme toggle switcher,
 * user account menu dropdown, and sign-out confirmation dialog modal.
 */

import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiArrowDownSLine,
  RiUserLine,
  RiLogoutBoxRLine,
  RiLockPasswordLine,
} from 'react-icons/ri';
import ThemeToggle from '../../common/ThemeToggle/ThemeToggle';
import Avatar from '../../common/Avatar/Avatar';
import { useAuth } from '../../../hooks/useAuth';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { ROUTES } from '../../../constants/routes';
import toast from 'react-hot-toast';
import './Navbar.css';

/* ── Sign Out Confirmation Modal ─────────── */
function SignOutModal({ onConfirm, onCancel, loading }) {
  return (
    <div className="signout-overlay" role="dialog" aria-modal="true" aria-label="Sign out confirmation">
      <div className="signout-modal">
        <div className="signout-icon-wrap">
          <RiLogoutBoxRLine className="signout-icon" />
        </div>
        <h2 className="signout-title">Sign Out</h2>
        <p className="signout-text">Are you sure you want to sign out?</p>
        <div className="signout-actions">
          <button className="signout-btn-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="signout-btn-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Signing out…' : 'Yes, Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef(null);

  useClickOutside(menuRef, () => setOpen(false));

  const handleSignOutConfirm = async () => {
    setSigningOut(true);
    try {
      await logout();
      toast.success('Signed out successfully.');
      setShowSignOut(false);
      navigate('/', { replace: true, state: { signedOut: true } });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <span className="navbar-title">Leave Management System</span>
        </div>

        <div className="navbar-right">
          <ThemeToggle />

          <div className="user-menu" ref={menuRef}>
            <button className="user-menu-trigger" onClick={() => setOpen((o) => !o)}>
              <Avatar name={user?.name} size="sm" />
              <div className="user-menu-info">
                <span className="user-menu-name">{user?.name ?? 'User'}</span>
                <span className="user-menu-role">{user?.role?.name}</span>
              </div>
              <RiArrowDownSLine />
            </button>

            {open && (
              <div className="user-dropdown" role="menu">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-name">{user?.name}</div>
                  <div className="user-dropdown-email">{user?.email}</div>
                </div>
                <Link
                  to={ROUTES.PROFILE}
                  className="user-dropdown-item"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  <RiUserLine /> My Profile
                </Link>
                <Link
                  to={ROUTES.CHANGE_PASSWORD}
                  className="user-dropdown-item"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  <RiLockPasswordLine /> Change Password
                </Link>
                <div className="user-dropdown-divider" />
                <button
                  className="user-dropdown-item danger"
                  onClick={() => { setOpen(false); setShowSignOut(true); }}
                  role="menuitem"
                >
                  <RiLogoutBoxRLine /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showSignOut && (
        <SignOutModal
          onConfirm={handleSignOutConfirm}
          onCancel={() => setShowSignOut(false)}
          loading={signingOut}
        />
      )}
    </>
  );
}
