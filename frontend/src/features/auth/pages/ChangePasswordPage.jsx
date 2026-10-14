/**
 * @file ChangePasswordPage.jsx
 * @description Mandatory & Self-Service Password Change Security Interface.
 * Handles credential verification, minimum password length rules, password confirmation match checks,
 * and clears `force_password_change` flag upon successful password updates.
 *
 * @module features/auth/pages/ChangePasswordPage
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiLockPasswordLine, RiSaveLine, RiShieldCheckLine } from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import { useAuth } from '../../../hooks/useAuth';
import * as authApi from '../../../api/authApi';
import { storage } from '../../../utils/storage';
import { extractApiError } from '../../../utils/helpers';
import { ROUTES } from '../../../constants/routes';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /* Show a special banner when forced */
  const isForced = !!user?.force_password_change;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.current_password) errs.current_password = 'Current password is required.';
    if (!form.password) errs.password = 'New password is required.';
    else if (form.password.length < 8) errs.password = 'Must be at least 8 characters.';
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await authApi.changePassword(form);
      // Backend returns new token after password change
      const payload = res.data ?? res;
      if (payload.token) storage.setToken(payload.token);
      // Update user so force_password_change is cleared
      if (payload.user) updateUser(payload.user);
      else updateUser({ force_password_change: 0 });

      toast.success('Password changed successfully.');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      if (err?.errors) setErrors(err.errors);
      else toast.error(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Change Password"
        subtitle={isForced ? 'You must set a new password before continuing.' : 'Update your account password'}
      />

      {isForced && (
        <div className="force-pwd-banner">
          <RiShieldCheckLine className="force-pwd-icon" />
          <span>For security, please change your temporary password before using the system.</span>
        </div>
      )}

      <Card style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input
            name="current_password"
            label={isForced ? 'Temporary Password' : 'Current Password'}
            type="password"
            value={form.current_password}
            onChange={handleChange}
            leftIcon={<RiLockPasswordLine />}
            error={errors.current_password}
            required
          />
          <Input
            name="password"
            label="New Password"
            type="password"
            value={form.password}
            onChange={handleChange}
            leftIcon={<RiLockPasswordLine />}
            error={errors.password}
            required
          />
          <Input
            name="password_confirmation"
            label="Confirm New Password"
            type="password"
            value={form.password_confirmation}
            onChange={handleChange}
            leftIcon={<RiLockPasswordLine />}
            error={errors.password_confirmation}
            required
          />
          <Button type="submit" loading={loading} leftIcon={<RiSaveLine />}>
            {isForced ? 'Set New Password' : 'Update Password'}
          </Button>
        </form>
      </Card>

      <style>{`
        .force-pwd-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--color-warning-bg);
          border: 1px solid var(--color-warning);
          color: var(--color-warning);
          font-size: var(--font-size-sm);
          font-weight: 500;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          margin-bottom: 20px;
          max-width: 480px;
        }
        .force-pwd-icon { font-size: 20px; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
