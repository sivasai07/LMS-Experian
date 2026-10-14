/**
 * @file LandingPage.jsx
 * @description Public Enterprise Landing Page & Integrated Login Modal.
 * Showcases application capabilities, features showcase, product preview graphics, and handles authentication triggers.
 *
 * @module features/auth/pages/LandingPage
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  RiMenuLine,
  RiCloseLine,
  RiMailLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowRightLine,
  RiShieldUserLine,
  RiFileListLine,
  RiBarChartGroupedLine,
  RiCalendar2Line,
  RiSmartphoneLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
  RiTeamLine,
  RiPhoneLine,
  RiMapPinLine,
  RiCalendarCheckLine,
} from 'react-icons/ri';
import { useAuth } from '../../../hooks/useAuth';
import { extractApiError } from '../../../utils/helpers';
import { ROUTES } from '../../../constants/routes';
import toast from 'react-hot-toast';
import experianBigLogo from '../../../assets/images/logo/experian_big_logo.png';
import heroImg from '../../../assets/images/logo/landingpage.png';
import aboutImg from '../../../assets/images/logo/about.png';
import './LandingPage.css';

/* ─── Login Modal ────────────────────────────────────────── */
function LoginModal({ onClose }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const overlayRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setApiError('');
    try {
      const user = await login(form);
      setSuccessMsg('Login Successful! Redirecting to dashboard…');
      toast.success('Login Successful!');
      setTimeout(() => {
        onClose();
        if (user?.force_password_change) {
          navigate(ROUTES.CHANGE_PASSWORD, { replace: true });
        } else {
          navigate(ROUTES.DASHBOARD, { replace: true });
        }
      }, 4500);
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const data = err?.response?.data || err;
      if (status === 401 || status === 422) {
        setApiError(data?.message || 'Invalid email or password. Please check your credentials and try again.');
      } else {
        setApiError(extractApiError(data));
      }
      setLoading(false);
    }
  };

  return (
    <div
      className="lm-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Sign In"
    >
      <div className="lm-modal">
        <div className="lm-modal-header">
          <div className="lm-modal-logo-wrap">
            <img src={experianBigLogo} alt="Experian Logo" className="lm-modal-logo-img" />
          </div>
          <div className="lm-modal-heading">
            <h2 className="lm-modal-title">Welcome back</h2>
            <p className="lm-modal-sub">Sign in to your account</p>
          </div>
          <button className="lm-close-btn" onClick={onClose} aria-label="Close"><RiCloseLine /></button>
        </div>

        {successMsg && (
          <div className="lm-success-msg">
            <RiCheckboxCircleLine className="lm-success-icon" />
            <span>{successMsg}</span>
          </div>
        )}

        {apiError && (
          <div className="lm-api-error">
            <RiCloseLine className="lm-api-err-icon" />{apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="lm-form" noValidate>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-email">Email Address</label>
            <div className="lm-input-wrap">
              <RiMailLine className="lm-icon" />
              <input
                id="lm-email" name="email" type="email"
                className={`lm-input ${errors.email ? 'lm-input-err' : ''}`}
                placeholder="you@company.com"
                value={form.email} onChange={handleChange}
                disabled={loading || !!successMsg}
                autoFocus autoComplete="email"
              />
            </div>
            {errors.email && <span className="lm-err-msg">{errors.email}</span>}
          </div>
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-password">Password</label>
            <div className="lm-input-wrap">
              <RiLockPasswordLine className="lm-icon" />
              <input
                id="lm-password" name="password"
                type={showPassword ? 'text' : 'password'}
                className={`lm-input lm-input-pr ${errors.password ? 'lm-input-err' : ''}`}
                placeholder="Enter your password"
                value={form.password} onChange={handleChange}
                disabled={loading || !!successMsg}
                autoComplete="current-password"
              />
              <button type="button" className="lm-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
                disabled={loading || !!successMsg}
              >
                {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
            {errors.password && <span className="lm-err-msg">{errors.password}</span>}
          </div>
          <button type="submit" className={`lm-submit-btn ${successMsg ? 'lm-submit-success' : ''}`} disabled={loading || !!successMsg}>
            {successMsg ? (
              <><RiLoader4Line className="lm-spin" /><span>Redirecting to Dashboard…</span></>
            ) : loading ? (
              <><RiLoader4Line className="lm-spin" /><span>Signing in…</span></>
            ) : (
              <><span>Sign In</span><RiArrowRightLine /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Feature Card ───────────────────────────────────────── */
/* ─── Animated Counter ────────────────────────────────────── */
function Counter({ target, suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime = null;
          const duration = 2000;

          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(ease * target);
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref} className="lp-stat-num">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="lp-feature-card">
      <div className="lp-feature-icon">{icon}</div>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-desc">{description}</p>
    </div>
  );
}

/* ─── Landing Page ───────────────────────────────────────── */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(() => Boolean(location.state?.openLogin));
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const [signedOutMsg, setSignedOutMsg] = useState(() => Boolean(location.state?.signedOut));

  useEffect(() => {
    if (isAuthenticated && !loginOpen) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isAuthenticated, loginOpen, navigate]);

  useEffect(() => {
    if (location.state?.signedOut) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        setSignedOutMsg(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* IntersectionObserver — track which section is in view */
  useEffect(() => {
    const sections = ['home', 'features', 'about', 'contact'];
    const observers = [];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = useCallback((id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const features = [
    { icon: <RiCalendarCheckLine />, title: 'Leave Management', description: 'Apply, track and manage leaves effortlessly with automated workflows and smart notifications.' },
    { icon: <RiShieldUserLine />, title: 'Role Based Access', description: 'Secure dashboards tailored for Employees, Managers and HR with defined permissions.' },
    { icon: <RiFileListLine />, title: 'Approval Workflow', description: 'Streamlined approval process with real-time notifications and full audit trails.' },
    { icon: <RiBarChartGroupedLine />, title: 'Analytics & Reports', description: 'Powerful insights and reports for better decision making across the organisation.' },
    { icon: <RiCalendar2Line />, title: 'Holiday Calendar', description: 'Manage holidays and events in one place with automatic exclusion in calculations.' },
    { icon: <RiSmartphoneLine />, title: 'Responsive Design', description: 'Beautiful, consistent experience across all devices — desktop, tablet and mobile.' },
  ];

  return (
    <div className="lp-page">
      {signedOutMsg && (
        <div className="lp-signout-banner">
          <RiCheckboxCircleLine /> Signed out successfully.
        </div>
      )}

      {/* ── Navbar ─────────────────────────────────── */}
      <header className={`lp-navbar ${scrolled ? 'lp-navbar-scrolled' : ''}`}>
        <div className="lp-container lp-navbar-inner">
          <a
            href="#home"
            className="lp-logo"
            onClick={(e) => { e.preventDefault(); scrollTo('home'); }}
          >
            <img src={experianBigLogo} alt="Experian" className="lp-logo-img" />
            <span className="lp-logo-text">Leave Management System</span>
          </a>

          <nav className="lp-nav-links" aria-label="Main navigation">
            {['home', 'features', 'about', 'contact'].map((sec) => (
              <button
                key={sec}
                className={`lp-nav-link ${activeSection === sec ? 'lp-nav-active' : ''}`}
                onClick={() => scrollTo(sec)}
              >
                {sec.charAt(0).toUpperCase() + sec.slice(1)}
              </button>
            ))}
          </nav>

          <div className="lp-nav-right">
            <button className="lp-login-btn" onClick={() => setLoginOpen(true)}>Login</button>
            <button
              className="lp-hamburger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <RiCloseLine /> : <RiMenuLine />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lp-mobile-menu">
            {['home', 'features', 'about', 'contact'].map((sec) => (
              <button
                key={sec}
                className={`lp-mobile-link ${activeSection === sec ? 'lp-mobile-active' : ''}`}
                onClick={() => scrollTo(sec)}
              >
                {sec.charAt(0).toUpperCase() + sec.slice(1)}
              </button>
            ))}
            <button className="lp-mobile-login" onClick={() => { setMenuOpen(false); setLoginOpen(true); }}>
              Login
            </button>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────── */}
      <section id="home" className="lp-hero">
        <div className="lp-container lp-hero-inner">
          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <RiCheckboxCircleLine />Trusted by 500+ companies
            </div>
            <h1 className="lp-hero-title">
              Simplify Leaves.<br />
              Empower <span className="lp-accent">Productivity.</span>
            </h1>
            <p className="lp-hero-sub">
              A modern and intelligent leave management system for your organisation.
              Automate approvals, track balances and generate insightful reports.
            </p>
            <div className="lp-hero-actions">
              <button className="lp-btn-primary" onClick={() => setLoginOpen(true)}>
                Get Started <RiArrowRightLine />
              </button>
              <button className="lp-btn-outline" onClick={() => scrollTo('features')}>
                Explore Features
              </button>
            </div>
            <div className="lp-hero-stats">
              <div className="lp-stat">
                <Counter target={500} suffix="+" />
                <span className="lp-stat-lbl">Companies</span>
              </div>
              <div className="lp-stat-div" />
              <div className="lp-stat">
                <Counter target={10} suffix="K+" />
                <span className="lp-stat-lbl">Employees</span>
              </div>
              <div className="lp-stat-div" />
              <div className="lp-stat">
                <Counter target={99.9} suffix="%" decimals={1} />
                <span className="lp-stat-lbl">Uptime</span>
              </div>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-hero-img-wrap">
              <img src={heroImg} alt="Leave Management Dashboard" className="lp-hero-img" />
            </div>
            <div className="lp-float lp-float-1">
              <RiCheckboxCircleLine className="lp-float-icon lp-fi-green" />
              <span>Leave Approved!</span>
            </div>
            <div className="lp-float lp-float-2">
              <RiTeamLine className="lp-float-icon lp-fi-blue" />
              <span>Team online: 8</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section id="features" className="lp-features">
        <div className="lp-container">
          <div className="lp-section-hd">
            <span className="lp-tag">Features</span>
            <h2 className="lp-section-title">Everything you need to manage leaves</h2>
            <p className="lp-section-sub">
              Powerful features designed to streamline leave management for modern organisations.
            </p>
          </div>
          <div className="lp-features-grid">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────── */}
      <section id="about" className="lp-about">
        <div className="lp-container lp-about-inner">
          <div className="lp-about-content">
            <span className="lp-tag">About Us</span>
            <h2 className="lp-section-title lp-about-title">Built for modern HR teams</h2>
            <p className="lp-about-text">
              Our Leave Management System helps organisations automate leave operations,
              improve transparency and boost employee productivity. Built with modern
              technologies and best practices.
            </p>
            <ul className="lp-about-list">
              {[
                'Automated leave balance calculations',
                'Real-time approval notifications',
                'Comprehensive audit trails',
                'Multi-role support (HR, Manager, Employee)',
                'Holiday & weekend exclusion rules',
                'Secure JWT-based authentication',
              ].map((item) => (
                <li key={item} className="lp-about-item">
                  <RiCheckboxCircleLine className="lp-check-icon" />
                  {item}
                </li>
              ))}
            </ul>
            <button className="lp-btn-primary" onClick={() => setLoginOpen(true)}>
              Get Started Today <RiArrowRightLine />
            </button>
          </div>
          <div className="lp-about-visual">
            <img src={aboutImg} alt="About Leave Management System" className="lp-about-img" />
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────── */}
      <section id="contact" className="lp-contact">
        <div className="lp-container lp-contact-inner">
          <div className="lp-contact-info">
            <span className="lp-tag lp-tag-white">Contact Us</span>
            <h2 className="lp-contact-title">Get in touch with our team</h2>
            <p className="lp-contact-sub">
              Have questions? We're here to help you get started with your leave management journey.
            </p>
            <div className="lp-contact-details">
              <div className="lp-contact-row-item">
                <RiMailLine className="lp-contact-icon" />
                <span>support@leavemanagement.com</span>
              </div>
              <div className="lp-contact-row-item">
                <RiPhoneLine className="lp-contact-icon" />
                <span>+91-9876543210</span>
              </div>
              <div className="lp-contact-row-item">
                <RiMapPinLine className="lp-contact-icon" />
                <span>Phoenix Equinox, Gachibowli</span>
              </div>
            </div>
          </div>
          <div className="lp-contact-form-wrap">
            <form
              className="lp-contact-form"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Message sent! We'll get back to you soon.");
                e.target.reset();
              }}
            >
              <div className="lp-cf-row">
                <div className="lp-cf-field">
                  <label>First Name</label>
                  <input type="text" placeholder="John" required />
                </div>
                <div className="lp-cf-field">
                  <label>Last Name</label>
                  <input type="text" placeholder="Doe" required />
                </div>
              </div>
              <div className="lp-cf-field">
                <label>Email</label>
                <input type="email" placeholder="john@company.com" required />
              </div>
              <div className="lp-cf-field">
                <label>Message</label>
                <textarea rows={4} placeholder="How can we help you?" required />
              </div>
              <button type="submit" className="lp-btn-dark">
                Send Message <RiArrowRightLine />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">
              <img src={experianBigLogo} alt="Experian" className="lp-footer-logo-img" />
              <span className="lp-footer-logo-text">Leave Management</span>
            </div>
            <p className="lp-footer-tagline">Simplifying leave management for modern organisations.</p>
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <h4>Product</h4>
              <button onClick={() => scrollTo('features')}>Features</button>
              <button onClick={() => setLoginOpen(true)}>Login</button>
            </div>
            <div className="lp-footer-col">
              <h4>Company</h4>
              <button onClick={() => scrollTo('about')}>About</button>
              <button onClick={() => scrollTo('contact')}>Contact</button>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} Leave Management System. All rights reserved.</p>
        </div>
      </footer>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  );
}
