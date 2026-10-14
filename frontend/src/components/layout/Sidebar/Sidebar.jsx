/**
 * @file Sidebar.jsx
 * @description Main Navigation Sidebar & Collapsible Drawer Component.
 * Dynamically filters and renders role-based navigation menu links (Employee, Manager, HR)
 * featuring interactive active states, tooltip labels when collapsed, LMS logo brand dashboard link,
 * and bottom icon toggle control.
 *
 * @module components/layout/Sidebar
 */

import { Link, NavLink } from 'react-router-dom';
import {
  RiDashboardLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiTeamLine,
  RiUserLine,
  RiFileListLine,
  RiBuildingLine,
  RiPriceTagLine,
  RiCalendar2Line,
  RiBarChartLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
} from 'react-icons/ri';
import { ROUTES } from '../../../constants/routes';
import { ROLES } from '../../../constants/roles';
import { useAuth } from '../../../hooks/useAuth';
import experianSmallLogo from '../../../assets/images/logo/experian_small_logo.png';
import './Sidebar.css';

function NavItem({ to, icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-item-icon">{icon}</span>
      <span className="sidebar-item-text">{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const role = user?.role?.name;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <Link to={ROUTES.DASHBOARD} className="sidebar-logo" style={{ textDecoration: 'none', cursor: 'pointer' }}>
        <div className="sidebar-logo-icon">
          <img src={experianSmallLogo} alt="Experian" className="sidebar-logo-img" />
        </div>
        <span className="sidebar-logo-text">Leave Management</span>
      </Link>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        <NavItem to={ROUTES.DASHBOARD} icon={<RiDashboardLine />} label="Dashboard" collapsed={collapsed} />

        {/* Employee: My Leaves */}
        {(role === ROLES.EMPLOYEE || role === ROLES.MANAGER || role === ROLES.HR) && (
          <NavItem to={ROUTES.MY_LEAVES} icon={<RiCalendarLine />} label="My Leaves" collapsed={collapsed} />
        )}

        {/* Manager: team leaves */}
        {(role === ROLES.MANAGER || role === ROLES.HR) && (
          <NavItem to={ROUTES.TEAM_LEAVES} icon={<RiCalendarCheckLine />} label="Team Leaves" collapsed={collapsed} />
        )}

        {/* HR: all leave requests */}
        {role === ROLES.HR && (
          <NavItem to={ROUTES.LEAVE_REQUESTS} icon={<RiFileListLine />} label="Leave Requests" collapsed={collapsed} />
        )}

        {/* Manager & HR: team */}
        {(role === ROLES.MANAGER || role === ROLES.HR) && (
          <NavItem to={ROUTES.TEAM} icon={<RiTeamLine />} label="My Team" collapsed={collapsed} />
        )}

        {/* HR Admin section */}
        {role === ROLES.HR && (
          <>
            <div className="sidebar-section-label">People</div>
            <NavItem to={ROUTES.EMPLOYEES} icon={<RiUserLine />} label="Employees" collapsed={collapsed} />

            <div className="sidebar-section-label">Settings</div>
            <NavItem to={ROUTES.LEAVE_TYPES} icon={<RiPriceTagLine />} label="Leave Types" collapsed={collapsed} />
            <NavItem to={ROUTES.HOLIDAYS} icon={<RiCalendar2Line />} label="Holidays" collapsed={collapsed} />
            <NavItem to={ROUTES.DEPARTMENTS} icon={<RiBuildingLine />} label="Departments" collapsed={collapsed} />
            <NavItem to={ROUTES.GRADE_JOB_TITLES} icon={<RiBarChartLine />} label="Grade - Job Title" collapsed={collapsed} />
          </>
        )}
      </nav>

      {/* Icon-Only Collapse / Expand Toggle Control at Bottom */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <RiMenuUnfoldLine style={{ fontSize: '20px' }} /> : <RiMenuFoldLine style={{ fontSize: '20px' }} />}
        </button>
      </div>
    </aside>
  );
}
