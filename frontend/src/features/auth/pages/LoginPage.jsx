/**
 * @file LoginPage.jsx
 * @description Standalone Authentication & Sign-In Page Component.
 * Handles employee authentication form submission, API credential verification,
 * displaying green success feedback toasts/alerts, and performing post-login navigation redirects.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiMailLine, RiLockPasswordLine, RiCalendarCheckLine } from 'react-icons/ri';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import { useAuth } from '../../../hooks/useAuth';
import { extractApiError } from '../../../utils/helpers';
import { ROUTES } from '../../../constants/routes';
import toast from 'react-hot-toast';
import experianBigLogo from '../../../assets/images/logo/experian_big_logo.png';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  useEffect(() => {
    if (isAuthenticated && !success && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, success, loading, navigate, from]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      setSuccess(true);
      toast.success('Login Successful!');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 4500);
    } catch (err) {
      const msg = extractApiError(err.response?.data);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrap">
            <img src={experianBigLogo} alt="Experian" className="login-experian-logo" />
          </div>
          <h1 className="login-title">Leave Management</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {success && (
          <div className="login-success-banner">
            <RiCalendarCheckLine /> Login Successful! Redirecting to dashboard…
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            name="email"
            label="Email Address"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={handleChange}
            leftIcon={<RiMailLine />}
            required
          />
          <Input
            name="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            leftIcon={<RiLockPasswordLine />}
            required
          />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="login-footer">
          Demo accounts: <strong>hr@test.com</strong>, <strong>manager@test.com</strong>, <strong>employee@test.com</strong> (password: password)
        </p>
      </div>
    </div>
  );
}
