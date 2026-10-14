/**
 * @file DashboardLayout.jsx
 * @description Authenticated Dashboard Application Shell Layout.
 * Combines collapsible Sidebar navigation, sticky top Navbar, and dynamic React Router Outlet content area.
 * Controls sidebar collapse state (`data-collapsed`) for responsive CSS grid transitions.
 *
 * @module layouts/DashboardLayout
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar/Sidebar';
import Navbar from '../components/layout/Navbar/Navbar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard-layout" data-collapsed={collapsed}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="dashboard-main">
        <Navbar />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
