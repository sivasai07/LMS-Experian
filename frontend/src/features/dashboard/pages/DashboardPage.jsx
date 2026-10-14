/**
 * @file DashboardPage.jsx
 * @description Dynamic Role-Based Analytics & Overview Dashboard (Employee, Manager, HR).
 * Renders live leave balance donuts with hover legend highlights, real-time statistics,
 * compact Quick Actions, upcoming company holidays, department summaries, and recent leave requests.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiAddLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiHistoryLine,
  RiRefreshLine,
  RiSunLine,
  RiTeamLine,
  RiTimeLine,
  RiUserLine,
} from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Badge from '../../../components/common/Badge/Badge';
import Loader from '../../../components/common/Loader/Loader';
import { ROUTES } from '../../../constants/routes';
import { ROLES } from '../../../constants/roles';
import { LEAVE_STATUS_COLORS } from '../../../constants/leaveStatus';
import { useAuth } from '../../../hooks/useAuth';
import * as dashboardApi from '../../../api/dashboardApi';
import * as leaveApi from '../../../api/leaveApi';
import * as holidayApi from '../../../api/holidayApi';
import { formatDate } from '../../../utils/date';
import { formatDays } from '../../../utils/helpers';
import './DashboardPage.css';

/* ════════════════════════════════════
   STAT CARD COMPONENT
════════════════════════════════════ */
function StatCard({ icon, bg, color, label, value, sub }) {
  return (
    <div className="dash-stat-card">
      <div className="dash-stat-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="dash-stat-body">
        <span className="dash-stat-value">{value ?? 0}</span>
        <span className="dash-stat-label">{label}</span>
        {sub && <span className="dash-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   DONUT CHART COMPONENT
════════════════════════════════════ */
function LeaveDonut({ segments, centerLabel, centerSub, activeIndex, onHoverIndex }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const preparedSegments = [];
  let runningAngle = 0;
  for (const seg of segments) {
    const angle = total === 0 ? 0 : (seg.value / total) * 360;
    preparedSegments.push({
      ...seg,
      angle,
      startAngle: runningAngle,
    });
    runningAngle += angle;
  }

  const paths = preparedSegments.map((seg, idx) => {
    const isHovered = activeIndex === idx;
    if (total === 0) return null;
    const { angle, startAngle } = seg;

    const r = 70;
    const cx = 90;
    const cy = 90;

    const x1 = cx + r * Math.cos(((startAngle - 90) * Math.PI) / 180);
    const y1 = cy + r * Math.sin(((startAngle - 90) * Math.PI) / 180);
    const x2 = cx + r * Math.cos(((startAngle + angle - 90) * Math.PI) / 180);
    const y2 = cy + r * Math.sin(((startAngle + angle - 90) * Math.PI) / 180);

    const largeArc = angle > 180 ? 1 : 0;

    const d =
      angle >= 359.9
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`
        : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

    return (
      <path
        key={seg.label}
        d={d}
        fill="none"
        stroke={seg.color}
        strokeWidth={isHovered ? 24 : 20}
        style={{
          transition: 'stroke-width 0.25s ease, opacity 0.25s ease',
          opacity: activeIndex !== null && !isHovered ? 0.45 : 1,
          cursor: 'pointer',
        }}
        onMouseEnter={() => onHoverIndex?.(idx)}
        onMouseLeave={() => onHoverIndex?.(null)}
      />
    );
  });

  return (
    <div className="donut-container" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 200, height: 200, flexShrink: 0 }}>
      <svg viewBox="0 0 180 180" className="donut-svg" style={{ width: 200, height: 200 }}>
        <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-bg)" strokeWidth="20" />
        {paths}
      </svg>
      <div className="donut-center" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, pointerEvents: 'none' }}>
        <span className="donut-val" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{centerLabel}</span>
        {centerSub && <span className="donut-sub" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{centerSub}</span>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   Interactive Donut Card Container (HR Style)
════════════════════════════════════ */
function InteractiveDonutCard({ title, totalLabel, segments, actions }) {
  const [activeIdx, setActiveIdx] = useState(null);

  return (
    <Card title={title} actions={actions}>
      {segments.length > 0 ? (
        <div className="donut-card-body">
          <LeaveDonut
            segments={segments}
            centerLabel={totalLabel}
            centerSub="Total"
            activeIndex={activeIdx}
            onHoverIndex={setActiveIdx}
          />
          <div className="donut-legend">
            {segments.map((item, idx) => (
              <div
                key={item.label}
                className="donut-legend-item"
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                style={{
                  background: activeIdx === idx ? 'var(--color-bg)' : 'transparent',
                  fontWeight: activeIdx === idx ? 600 : 400,
                  transform: activeIdx === idx ? 'translateX(4px)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: activeIdx === idx ? '1px solid var(--color-border)' : '1px solid transparent',
                }}
              >
                <span className="donut-legend-dot" style={{ background: item.color, width: 14, height: 14, borderRadius: '50%' }} />
                <span className="donut-legend-text" style={{ fontSize: '15px', fontWeight: activeIdx === idx ? 600 : 500, color: 'var(--color-text-primary)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="dash-empty">No balance data.</p>
      )}
    </Card>
  );
}

/* ════════════════════════════════════
   Upcoming Holiday Cards
════════════════════════════════════ */
function HolidayCards({ holidays }) {
  if (!holidays || holidays.length === 0) {
    return <p className="dash-empty">No upcoming holidays scheduled.</p>;
  }

  return (
    <div className="holiday-cards-grid">
      {holidays.slice(0, 4).map((h) => (
        <div key={h.id || h.holiday_date} className="holiday-card">
          <div className="holiday-card-icon">🎉</div>
          <div>
            <div className="holiday-card-name">{h.holiday_name || h.name || h.title}</div>
            <div className="holiday-card-date">{formatDate(h.holiday_date)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════
   QUICK ACTIONS CARD
════════════════════════════════════ */
function QuickActionsCard({ role }) {
  const isHr = role === ROLES.HR || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const isManager = role === ROLES.MANAGER;

  return (
    <Card title="Quick Actions">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        <Link to={ROUTES.MY_LEAVES} style={{ textDecoration: 'none' }}>
          <div className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <RiAddLine />
            </div>
            <div>
              <div className="quick-action-title">Apply Leave</div>
              <div className="quick-action-sub">New application</div>
            </div>
          </div>
        </Link>

        {/* HR gets 3 quick actions: Apply Leave, Team Leaves, Employees */}
        {!isHr && (
          <Link to={ROUTES.MY_LEAVES} style={{ textDecoration: 'none' }}>
            <div className="quick-action-card">
              <div className="quick-action-icon" style={{ background: 'var(--color-accent-light-blue-light)', color: 'var(--color-accent-light-blue)' }}>
                <RiHistoryLine />
              </div>
              <div>
                <div className="quick-action-title">My Leaves</div>
                <div className="quick-action-sub">Balances & history</div>
              </div>
            </div>
          </Link>
        )}

        {(isManager || isHr) && (
          <Link to={ROUTES.TEAM_LEAVES} style={{ textDecoration: 'none' }}>
            <div className="quick-action-card">
              <div className="quick-action-icon" style={{ background: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
                <RiTeamLine />
              </div>
              <div>
                <div className="quick-action-title">Team Leaves</div>
                <div className="quick-action-sub">Approve requests</div>
              </div>
            </div>
          </Link>
        )}

        {isHr && (
          <Link to={ROUTES.EMPLOYEES} style={{ textDecoration: 'none' }}>
            <div className="quick-action-card">
              <div className="quick-action-icon" style={{ background: 'var(--color-accent-magenta-light)', color: 'var(--color-accent-magenta)' }}>
                <RiUserLine />
              </div>
              <div>
                <div className="quick-action-title">Employees</div>
                <div className="quick-action-sub">Manage staff</div>
              </div>
            </div>
          </Link>
        )}

        {!isManager && !isHr && (
          <Link to={ROUTES.PROFILE} style={{ textDecoration: 'none' }}>
            <div className="quick-action-card">
              <div className="quick-action-icon" style={{ background: 'var(--color-accent-raspberry-light)', color: 'var(--color-accent-raspberry)' }}>
                <RiUserLine />
              </div>
              <div>
                <div className="quick-action-title">Profile</div>
                <div className="quick-action-sub">View my account</div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </Card>
  );
}

/* ════════════════════════════════════
   EMPLOYEE DASHBOARD
════════════════════════════════════ */
function EmployeeDashboard() {
  const [dashData, setDashData] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = useCallback(() => {
    setLoading(true);
    Promise.all([
      dashboardApi.getEmployeeDashboard(),
      holidayApi.getHolidays(),
    ])
      .then(([dRes, hRes]) => {
        setDashData(dRes.data ?? dRes);
        const hd = hRes.data ?? hRes;
        const hList = Array.isArray(hd) ? hd : (hd?.data ?? []);
        const todayStr = new Date().toISOString().split('T')[0];
        const upcoming = hList
          .filter((h) => h.holiday_date >= todayStr)
          .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
        setHolidays(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      dashboardApi.getEmployeeDashboard(),
      holidayApi.getHolidays(),
    ])
      .then(([dRes, hRes]) => {
        if (!active) return;
        setDashData(dRes.data ?? dRes);
        const hd = hRes.data ?? hRes;
        const hList = Array.isArray(hd) ? hd : (hd?.data ?? []);
        const todayStr = new Date().toISOString().split('T')[0];
        const upcoming = hList
          .filter((h) => h.holiday_date >= todayStr)
          .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
        setHolidays(upcoming);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loader />;

  const d = (dashData?.data ?? dashData) ?? {};
  const recent = d.recent_leaves ?? d.recent_requests ?? [];
  const totalAlloc = Number(d.total_leaves ?? d.total_allocated ?? 0);
  const totalUsed = Number(d.used_leaves ?? d.total_used ?? 0);
  const totalAvail = Number(d.available_leaves ?? d.total_available ?? 0);
  const pendingCount = d.pending_requests ?? d.pending_count ?? 0;
  const approvedCount = d.approved_requests ?? d.approved_count ?? 0;

  const displayHolidays = holidays.length > 0 ? holidays : (d.upcoming_holidays ?? []);

  const empSegments = [
    { label: `Available (${formatDays(totalAvail)})`, value: Math.max(0, totalAvail), color: '#2E6BC6' },
    { label: `Used (${formatDays(totalUsed)})`, value: Math.max(0, totalUsed), color: '#D82274' },
  ].filter((s) => s.value > 0);

  return (
    <>
      <div className="dash-stats-row">
        <StatCard icon={<RiCalendarCheckLine />} bg="var(--color-primary-light)" color="var(--color-primary)" label="Available Balance" value={`${formatDays(totalAvail)} days`} />
        <StatCard icon={<RiCalendarLine />} bg="var(--color-secondary-light)" color="var(--color-secondary)" label="Total Allocated" value={`${formatDays(totalAlloc)} days`} />
        <StatCard icon={<RiTimeLine />} bg="var(--color-accent-magenta-light)" color="var(--color-accent-magenta)" label="Pending Requests" value={pendingCount} />
        <StatCard icon={<RiSunLine />} bg="var(--color-accent-light-blue-light)" color="var(--color-accent-light-blue)" label="Approved Requests" value={approvedCount} />
      </div>

      <div className="dash-grid-2" style={{ marginTop: 20 }}>
        {/* Employee Interactive Donut Card */}
        <InteractiveDonutCard
          title="My Leave Balance"
          totalLabel={`${formatDays(totalAvail)} / ${formatDays(totalAlloc)}`}
          segments={empSegments}
          actions={<Button size="sm" variant="ghost" leftIcon={<RiRefreshLine />} onClick={fetchEmployeeData}>Refresh</Button>}
        />

        <Card title="Recent Leave Requests">
          {recent.length === 0 ? (
            <p className="dash-empty">No leave requests found.</p>
          ) : (
            <div className="recent-requests-list">
              {recent.slice(0, 5).map((l) => (
                <div key={l.id} className="recent-req-row">
                  <div>
                    <div className="recent-req-dates">{formatDate(l.start_date)} – {formatDate(l.end_date)}</div>
                    <div className="recent-req-type">{l.leave_type || l.leave_type_name || 'Leave'} · {formatDays(l.working_days ?? l.days_requested ?? 1)} day(s)</div>
                  </div>
                  <Badge variant={LEAVE_STATUS_COLORS[l.status] ?? 'default'} size="sm">
                    {l.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="dash-grid-2" style={{ marginTop: 20 }}>
        <QuickActionsCard role={ROLES.EMPLOYEE} />

        <Card title="Upcoming Holidays">
          <HolidayCards holidays={displayHolidays} />
        </Card>
      </div>
    </>
  );
}

/* ════════════════════════════════════
   MANAGER DASHBOARD
════════════════════════════════════ */
function ManagerDashboard() {
  const [dashData, setDashData] = useState(null);
  const [myBalances, setMyBalances] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchManagerData = useCallback(() => {
    setLoading(true);
    Promise.all([
      dashboardApi.getManagerDashboard(),
      leaveApi.getMyBalances(),
      holidayApi.getHolidays(),
    ])
      .then(([dRes, bRes, hRes]) => {
        setDashData(dRes.data ?? dRes);
        const bd = bRes.data ?? bRes;
        setMyBalances(Array.isArray(bd) ? bd : [bd]);
        const hd = hRes.data ?? hRes;
        const hList = Array.isArray(hd) ? hd : (hd?.data ?? []);
        const todayStr = new Date().toISOString().split('T')[0];
        const upcoming = hList
          .filter((h) => h.holiday_date >= todayStr)
          .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
        setHolidays(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      dashboardApi.getManagerDashboard(),
      leaveApi.getMyBalances(),
      holidayApi.getHolidays(),
    ])
      .then(([dRes, bRes, hRes]) => {
        if (!active) return;
        setDashData(dRes.data ?? dRes);
        const bd = bRes.data ?? bRes;
        setMyBalances(Array.isArray(bd) ? bd : [bd]);
        const hd = hRes.data ?? hRes;
        const hList = Array.isArray(hd) ? hd : (hd?.data ?? []);
        const todayStr = new Date().toISOString().split('T')[0];
        const upcoming = hList
          .filter((h) => h.holiday_date >= todayStr)
          .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
        setHolidays(upcoming);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loader />;

  const d = dashData ?? {};
  const pendingList = d.pending_requests ?? [];
  const teamOnLeave = d.team_on_leave_today ?? [];
  const summary = d.team_leave_summary ?? {};

  const myAvail = myBalances.reduce((s, b) => s + Number(b.balance ?? 0), 0);
  const myUsed = myBalances.reduce((s, b) => s + Number(b.used ?? 0), 0);
  const myTotal = myBalances.reduce((s, b) => s + Number(b.allocated ?? 0), 0);

  const managerSegments = [
    { label: `Available (${formatDays(myAvail)})`, value: Math.max(0, myAvail), color: '#2E6BC6' },
    { label: `Used (${formatDays(myUsed)})`, value: Math.max(0, myUsed), color: '#D82274' },
  ].filter((s) => s.value > 0);

  return (
    <>
      <div className="dash-stats-row">
        <StatCard icon={<RiTeamLine />} bg="var(--color-primary-light)" color="var(--color-primary)" label="Team Size" value={d.team_size} />
        <StatCard icon={<RiTimeLine />} bg="var(--color-accent-magenta-light)" color="var(--color-accent-magenta)" label="Pending Approvals" value={d.pending_approvals} />
        <StatCard icon={<RiCheckboxCircleLine />} bg="var(--color-secondary-light)" color="var(--color-secondary)" label="Approved" value={summary.approved} />
        <StatCard icon={<RiSunLine />} bg="var(--color-accent-light-blue-light)" color="var(--color-accent-light-blue)" label="On Leave Today" value={teamOnLeave.length} />
      </div>

      <div className="dash-grid-2" style={{ marginTop: 20 }}>
        {/* Manager Interactive Donut Matching HR style */}
        <InteractiveDonutCard
          title="My Leave Balance"
          totalLabel={formatDays(myTotal)}
          segments={managerSegments}
          actions={<Button size="sm" variant="ghost" leftIcon={<RiRefreshLine />} onClick={fetchManagerData}>Refresh</Button>}
        />

        <Card title="Pending Approvals">
          {pendingList.length === 0 ? (
            <p className="dash-empty">No pending requests.</p>
          ) : (
            <div className="recent-requests-list">
              {pendingList.slice(0, 5).map((l) => (
                <div key={l.id} className="recent-req-row">
                  <div>
                    <div className="recent-req-dates">{l.employee_name}</div>
                    <div className="recent-req-type">{l.leave_type} · {formatDate(l.start_date)} – {formatDate(l.end_date)}</div>
                  </div>
                  <Badge variant="warning" size="sm">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions & Team Status */}
      <div className="dash-grid-2" style={{ marginTop: 20 }}>
        <QuickActionsCard role={ROLES.MANAGER} />

        <Card title="Upcoming Holidays">
          <HolidayCards holidays={holidays} />
        </Card>
      </div>
    </>
  );
}

/* ════════════════════════════════════
   HR DASHBOARD
════════════════════════════════════ */
function HrLeaveSummaryCard({ totalLeaves, hrDonut, d, load }) {
  const [activeLegendIdx, setActiveLegendIdx] = useState(null);

  const legendItems = [
    { color: '#2E6BC6', label: 'Approved', value: d.approved_requests ?? 0 },
    { color: '#D82274', label: 'Pending', value: d.pending_requests ?? 0 },
    { color: '#5C246E', label: 'Rejected', value: d.rejected_requests ?? 0 },
  ];

  return (
    <Card
      title="Company Leave Summary"
      actions={
        <Button size="sm" variant="ghost" leftIcon={<RiRefreshLine />} onClick={load}>
          Refresh
        </Button>
      }
    >
      {totalLeaves > 0 ? (
        <div className="donut-card-body">
          <LeaveDonut
            segments={hrDonut.length > 0 ? hrDonut : [{ label: 'No data', value: 1, color: 'var(--color-border)' }]}
            centerLabel={totalLeaves}
            centerSub="Total Requests"
            activeIndex={activeLegendIdx}
            onHoverIndex={setActiveLegendIdx}
          />
          <div className="donut-legend">
            {legendItems.map((item, idx) => (
              <div
                key={item.label}
                className="donut-legend-item"
                onMouseEnter={() => setActiveLegendIdx(idx)}
                onMouseLeave={() => setActiveLegendIdx(null)}
                style={{
                  background: activeLegendIdx === idx ? 'var(--color-bg)' : 'transparent',
                  fontWeight: activeLegendIdx === idx ? 600 : 400,
                  transform: activeLegendIdx === idx ? 'translateX(4px)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: activeLegendIdx === idx ? '1px solid var(--color-border)' : '1px solid transparent',
                }}
              >
                <span className="donut-legend-dot" style={{ background: item.color, width: 14, height: 14, borderRadius: '50%' }} />
                <span className="donut-legend-text" style={{ fontSize: '15px', fontWeight: activeLegendIdx === idx ? 600 : 500, color: 'var(--color-text-primary)' }}>
                  {item.label} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="dash-empty">No leave data yet.</p>
      )}
    </Card>
  );
}

function HrDashboard() {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHrData = useCallback(() => {
    setLoading(true);
    dashboardApi.getHrDashboard()
      .then((res) => setDashData(res.data ?? res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    dashboardApi.getHrDashboard()
      .then((res) => {
        if (active) setDashData(res.data ?? res);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loader />;

  const d = dashData ?? {};
  const recentRequests = d.recent_requests ?? [];
  const upcomingHolidays = d.upcoming_holidays ?? [];
  const deptSummary = d.department_leave_summary ?? [];

  const totalLeaves = (d.pending_requests ?? 0) + (d.approved_requests ?? 0) + (d.rejected_requests ?? 0);
  const hrDonut = [
    { label: 'Approved', value: Number(d.approved_requests ?? 0), color: '#2E6BC6' },
    { label: 'Pending', value: Number(d.pending_requests ?? 0), color: '#D82274' },
    { label: 'Rejected', value: Number(d.rejected_requests ?? 0), color: '#5C246E' },
  ].filter((s) => s.value > 0);

  return (
    <>
      <div className="dash-stats-row">
        <StatCard icon={<RiUserLine />} bg="var(--color-primary-light)" color="var(--color-primary)" label="Total Employees" value={d.total_employees} />
        <StatCard icon={<RiTimeLine />} bg="var(--color-accent-magenta-light)" color="var(--color-accent-magenta)" label="Pending" value={d.pending_requests} />
        <StatCard icon={<RiCheckboxCircleLine />} bg="var(--color-secondary-light)" color="var(--color-secondary)" label="Approved" value={d.approved_requests} />
        <StatCard icon={<RiSunLine />} bg="var(--color-accent-light-blue-light)" color="var(--color-accent-light-blue)" label="On Leave Today" value={d.on_leave_today} />
      </div>

      {/* 2-Column Balanced Grid Layout */}
      <div className="dash-grid-2" style={{ marginTop: 20 }}>
        {/* Left Column: Company Leave Summary (Donut) + Department Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <HrLeaveSummaryCard totalLeaves={totalLeaves} hrDonut={hrDonut} d={d} load={fetchHrData} />

          <Card title="Department Summary">
            {deptSummary.length > 0 ? (
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Employees</th>
                    <th>Days Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {deptSummary.map((dept) => (
                    <tr key={dept.id}>
                      <td>{dept.name}</td>
                      <td>{dept.employee_count}</td>
                      <td>{dept.total_leaves_taken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="dash-empty">No department summaries available.</p>
            )}
          </Card>
        </div>

        {/* Right Column: Quick Actions + Upcoming Holidays + 4 Recent Leave Requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <QuickActionsCard role={ROLES.HR} />

          <Card title="Upcoming Holidays">
            <HolidayCards holidays={upcomingHolidays} />
          </Card>

          <Card title="Recent Leave Requests">
            {recentRequests.length === 0 ? (
              <p className="dash-empty">No recent requests.</p>
            ) : (
              <div className="recent-requests-list">
                {recentRequests.slice(0, 4).map((l) => (
                  <div key={l.id} className="recent-req-row">
                    <div>
                      <div className="recent-req-dates">{l.employee_name}</div>
                      <div className="recent-req-type">{l.leave_type} · {formatDate(l.start_date)}</div>
                    </div>
                    <Badge variant={LEAVE_STATUS_COLORS[l.status] ?? 'default'} size="sm">
                      {l.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════
   MAIN
════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role?.name;

  return (
    <div className="dashboard-page">
      <PageHeader title="Dashboard" description="Overview of your leave status and company updates." />

      {role === ROLES.HR || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN ? (
        <HrDashboard />
      ) : role === ROLES.MANAGER ? (
        <ManagerDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}
