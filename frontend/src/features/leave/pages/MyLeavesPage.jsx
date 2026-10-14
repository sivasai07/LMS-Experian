/**
 * @file MyLeavesPage.jsx
 * @description Personal Leave Management & Application View.
 * Enables employees to view live leave balance breakdowns, submit new leave applications,
 * filter personal leave history by status, cancel pending/approved leave requests,
 * view leave policy summaries, and view upcoming company holidays in an interactive calendar.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFileTextLine,
  RiHistoryLine,
  RiRefreshLine,
} from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Badge from '../../../components/common/Badge/Badge';
import Pagination from '../../../components/common/Pagination/Pagination';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import Select from '../../../components/common/Select/Select';
import { TableRowSkeleton } from '../../../components/common/Skeleton/Skeleton';
import Modal from '../../../components/common/Modal/Modal';
import ApplyLeaveForm from '../components/ApplyLeaveForm';
import LeaveDetailModal from '../components/LeaveDetailModal';
import LeavePolicyModal from '../components/LeavePolicyModal';
import * as leaveApi from '../../../api/leaveApi';
import * as holidayApi from '../../../api/holidayApi';
import * as dashboardApi from '../../../api/dashboardApi';
import { formatDate } from '../../../utils/date';
import { normalizeMeta } from '../../../utils/userHelpers';
import { extractApiError, extractArray, formatDays } from '../../../utils/helpers';
import { usePagination } from '../../../hooks/usePagination';
import toast from 'react-hot-toast';
import './LeavePage.css';
import './MyLeavePage.css';

/* ════════════════════════════════════════
   Animated SVG Donut (Static center, hover details outside)
════════════════════════════════════════ */
function AnimatedDonut({ segments, size, strokeWidth, activeIndex, onHoverIndex }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;

  const cumulativePct = [];
  let cum = 0;
  segments.forEach((s) => {
    cumulativePct.push(cum);
    cum += s.value / total;
  });

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="donut-svg"
        aria-label="Leave balance donut chart"
        style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
      >
        {/* Track ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashLen = circ * pct;
          const gapLen = circ - dashLen;
          const offset = circ * (1 - cumulativePct[i]) + circ * 0.25;
          const isHovered = activeIndex === i;

          return (
            <circle
              key={seg.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth - 2}
              strokeDasharray={`${dashLen} ${gapLen}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                opacity: mounted ? 1 : 0,
                transform: mounted ? `scale(${isHovered ? 1.04 : 1})` : 'scale(0.8)',
                transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                cursor: seg.value > 0 ? 'pointer' : 'default',
              }}
              onMouseEnter={seg.value > 0 ? () => onHoverIndex?.(i) : undefined}
              onMouseLeave={() => onHoverIndex?.(null)}
            />
          );
        })}
      </svg>
    </div>
  );
}

AnimatedDonut.defaultProps = { size: 180, strokeWidth: 28 };

/* ════════════════════════════════════════
   Leave Balance Card — Available & Used ONLY (Hover matter outside donut)
════════════════════════════════════════ */
const COLOR_AVAILABLE = '#2E6BC6'; // Experian Light Blue
const COLOR_USED      = '#D82274'; // Experian Magenta

function LeaveBalanceCard({ balances, dashData, loading }) {
  const [activeLegendIdx, setActiveLegendIdx] = useState(null);

  if (loading) {
    return (
      <div className="balance-card-wrap">
        <div className="donut-loading-wrap"><div className="donut-loading-ring" /></div>
        <div className="balance-legend">
          {[1, 2].map((n) => (
            <div key={n} className="legend-item">
              <div className="legend-color" style={{ background: 'var(--color-border)' }} />
              <div style={{ height: 12, width: 90, background: 'var(--color-border)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const available = Number(dashData?.available_leaves ?? 0);
  const used      = Number(dashData?.used_leaves ?? 0);
  const total     = Number(dashData?.total_leaves ?? (available + used));

  const totalAllocated = balances.reduce((s, b) => s + Number(b.allocated ?? 0), 0);
  const totalUsed      = balances.reduce((s, b) => s + Number(b.used ?? 0), 0);
  const totalBalance   = balances.reduce((s, b) => s + Number(b.balance ?? 0), 0);

  const centerVal = dashData ? total : totalAllocated;
  const avVal     = dashData ? available : totalBalance;
  const usedVal   = dashData ? used : totalUsed;

  const segments = [
    { label: 'Available', value: Math.max(0, avVal), color: COLOR_AVAILABLE },
    { label: 'Used',      value: Math.max(0, usedVal), color: COLOR_USED },
  ].filter((s) => s.value > 0);

  if (segments.length === 0) {
    segments.push({ label: 'No data', value: 1, color: 'var(--color-border)' });
  }

  const legendItems = [
    { color: COLOR_AVAILABLE, label: 'Available', value: avVal },
    { color: COLOR_USED,      label: 'Used',      value: usedVal },
  ];

  return (
    <div className="balance-card-wrap">
      <div className="donut-container">
        <AnimatedDonut
          segments={segments}
          size={180}
          strokeWidth={28}
          activeIndex={activeLegendIdx}
          onHoverIndex={setActiveLegendIdx}
        />
        {/* Inside Center: Available / Total */}
        <div className="donut-center">
          <span className="donut-val">{`${formatDays(avVal)} / ${formatDays(centerVal)}`}</span>
          <span className="donut-sub">Available / Total</span>
        </div>
      </div>

      {/* Legend Outside Donut Ring with Interactive Hover Detail */}
      <div className="balance-legend">
        {legendItems.map((item, idx) => (
          <div
            key={item.label}
            className="legend-item"
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
            <div className="legend-color" style={{ background: item.color, borderRadius: 3 }} />
            <div className="legend-text">
              <span className="legend-name">{item.label}</span>
              <span className="legend-nums" style={{ color: item.color, fontWeight: 700 }}>
                ({formatDays(item.value)})
              </span>
            </div>
          </div>
        ))}

        <div className="bal-totals">
          <div className="bal-total-item">
            <span className="bal-total-num used">{formatDays(usedVal)}</span>
            <span className="bal-total-lbl">Used</span>
          </div>
          <div className="bal-total-sep" />
          <div className="bal-total-item">
            <span className="bal-total-num avail">{formatDays(avVal)}</span>
            <span className="bal-total-lbl">Left</span>
          </div>
          <div className="bal-total-sep" />
          <div className="bal-total-item">
            <span className="bal-total-num total">{formatDays(centerVal)}</span>
            <span className="bal-total-lbl">Total</span>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Leave Calendar — Highlighting Pending & Approved
════════════════════════════════════════ */
const DAY_NAMES   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function LeaveCalendar({ leaves, holidays }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y-1); } else setMonth((m) => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y+1); } else setMonth((m) => m+1); };

  const dayMap = {};
  holidays.forEach((h) => {
    const d = h.holiday_date ?? h.date;
    if (d) dayMap[d] = { type: 'holiday', label: h.holiday_name ?? h.name };
  });

  leaves.forEach((l) => {
    if (!l.start_date || !l.end_date) return;
    const st = String(l.status ?? '').toLowerCase();
    if (st === 'cancelled' || st === 'canceled' || st === 'rejected') return;

    const [sY, sM, sD] = l.start_date.split('-').map(Number);
    const [eY, eM, eD] = l.end_date.split('-').map(Number);
    const cur = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    const isSingleDay = l.start_date === l.end_date;

    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;

      if (!dayMap[key] || dayMap[key].type !== 'holiday') {
        let isHalf = false;
        let portionTag = '';

        if (isSingleDay) {
          if (l.is_half_day) {
            isHalf = true;
            portionTag = l.half_day_type === 'first_half' || l.start_half_day === 'first_half'
              ? ' (1st Half)'
              : l.half_day_type === 'second_half' || l.start_half_day === 'second_half'
              ? ' (2nd Half)'
              : ' (Half Day)';
          }
        } else {
          // Multi-day request: check if this specific date is a half-day portion
          if (key === l.start_date && (l.start_half_day === 'second_half' || l.half_day_type === 'second_half')) {
            isHalf = true;
            portionTag = ' (2nd Half)';
          } else if (key === l.end_date && (l.end_half_day === 'first_half' || l.half_day_type === 'first_half')) {
            isHalf = true;
            portionTag = ' (1st Half)';
          }
        }

        const typeName = l.leave_type?.name ?? l.leave_type_name ?? 'Leave';

        dayMap[key] = {
          type: 'leave',
          status: l.status,
          isHalfDay: isHalf,
          label: `${typeName}${portionTag} (${l.status})`,
        };
      }
      cur.setDate(cur.getDate() + 1);
    }
  });

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayStr    = now.toISOString().slice(0, 10);
  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];

  return (
    <div className="leave-cal">
      <div className="cal-hd">
        <button className="cal-nav-btn" onClick={prevMonth} aria-label="Prev"><RiArrowLeftSLine /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="cal-title">{MONTH_NAMES[month]}</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              fontSize: 'var(--font-size-base)',
              cursor: 'pointer'
            }}
          >
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next"><RiArrowRightSLine /></button>
      </div>
      <div className="cal-grid">
        {DAY_NAMES.map((d) => <div key={d} className="cal-day-hd">{d}</div>)}
        {cells.map((day, idx) => {
          if (!day) return <div key={`_${idx}`} />;
          const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const info = dayMap[ds];
          const isToday = ds === todayStr;
          let cls = 'cal-day';
          if (isToday) cls += ' is-today';
          if (info?.type === 'holiday') cls += ' is-holiday';
          else if (info?.type === 'leave') {
            const st = String(info.status ?? '').toLowerCase();
            if (info.isHalfDay) cls += ' is-halfday';
            else if (st === 'approved') cls += ' is-approved';
            else if (st === 'pending')  cls += ' is-pending';
            else if (st === 'rejected') cls += ' is-rejected';
          }
          return (
            <div key={ds} className={cls} title={info?.label ?? ''}>
              <span className="cal-num">{day}</span>
              {info?.isHalfDay && <span className="half-dot" />}
            </div>
          );
        })}
      </div>
      <div className="cal-leg">
        <span className="cal-leg-item"><span className="cal-leg-dot ld-today"/>Today</span>
        <span className="cal-leg-item"><span className="cal-leg-dot ld-approved"/>Approved</span>
        <span className="cal-leg-item"><span className="cal-leg-dot ld-pending"/>Pending</span>
        <span className="cal-leg-item"><span className="cal-leg-dot ld-halfday"/>Half</span>
        <span className="cal-leg-item"><span className="cal-leg-dot ld-holiday"/>Holiday</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function MyLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [meta, setMeta] = useState(null);
  const [balances, setBalances] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [detailLeave, setDetailLeave] = useState(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [leaveTypesList, setLeaveTypesList] = useState([]);
  
  // Cancel Leave Confirmation Modal States
  const [cancelModalLeave, setCancelModalLeave] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const { page, setPage, perPage, setPerPage } = usePagination();

  // Load configured leave types for filter dropdown
  useEffect(() => {
    leaveApi.getLeaveTypes().then((res) => {
      setLeaveTypesList(extractArray(res) ?? []);
    }).catch(() => {});
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await dashboardApi.getEmployeeDashboard();
      setDashData(res.data ?? res);
    } catch { /* silent */ }
  }, []);

  const refreshBalance = useCallback(() => {
    setLoadingBalance(true);
    Promise.allSettled([
      leaveApi.getMyBalances(),
      holidayApi.getHolidays({}),
      dashboardApi.getEmployeeDashboard(),
      leaveApi.getMyLeaves({ per_page: 200 }),
    ]).then(([balRes, holRes, dashRes, allLeavesRes]) => {
      if (balRes.status === 'fulfilled') {
        const bd = balRes.value.data ?? balRes.value;
        setBalances(Array.isArray(bd) ? bd : (bd ? [bd] : []));
      }
      if (holRes.status === 'fulfilled') {
        setHolidays(extractArray(holRes.value));
      }
      if (dashRes.status === 'fulfilled') {
        setDashData(dashRes.value.data ?? dashRes.value);
      }
      if (allLeavesRes.status === 'fulfilled') {
        setAllLeaves(extractArray(allLeavesRes.value));
      }
      setLoadingBalance(false);
    });
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const fetchAllLeaves = useCallback(() => {
    leaveApi.getMyLeaves({ per_page: 200 })
      .then((res) => setAllLeaves(extractArray(res)))
      .catch(() => {});
  }, []);

  const fetchLeaves = useCallback(() => {
    setLoadingTable(true);
    leaveApi.getMyLeaves({
      page,
      per_page: perPage,
      status: statusFilter,
      leave_type_id: typeFilter,
      month: monthFilter,
    })
      .then((res) => {
        setLeaves(extractArray(res));
        setMeta(normalizeMeta(res.meta));
      })
      .catch(() => {})
      .finally(() => setLoadingTable(false));
  }, [page, perPage, statusFilter, typeFilter, monthFilter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  // Client-side filtering fallback
  const displayLeaves = useMemo(() => {
    return leaves.filter((l) => {
      if (typeFilter && String(l.leave_type_id) !== String(typeFilter)) return false;
      if (statusFilter && String(l.status).toLowerCase() !== String(statusFilter).toLowerCase()) return false;
      if (monthFilter && !String(l.start_date).startsWith(monthFilter)) return false;
      return true;
    });
  }, [leaves, typeFilter, statusFilter, monthFilter]);

  const handleApplySuccess = () => {
    setApplyOpen(false);
    fetchLeaves();
    fetchAllLeaves();
    refreshBalance();
    loadDashboard();
  };

  const handleCancelLeave = async (id, reason) => {
    await leaveApi.cancelLeave(id, { cancellation_reason: reason });
    fetchLeaves();
    fetchAllLeaves();
    refreshBalance();
    loadDashboard();
    setDetailLeave(null);
    toast.success('Leave cancelled.');
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalLeave) return;
    setCancelling(true);
    try {
      await leaveApi.cancelLeave(cancelModalLeave.id, { cancellation_reason: cancelReason });
      toast.success('Leave request cancelled successfully. Days added back to balance.');
      setCancelModalLeave(null);
      setCancelReason('');
      fetchLeaves();
      fetchAllLeaves();
      refreshBalance();
      loadDashboard();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setCancelling(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Approved':
      case 'approved': return 'success';
      case 'Pending':
      case 'pending': return 'warning';
      case 'Rejected':
      case 'rejected':
      case 'Cancelled':
      case 'cancelled':
      case 'Canceled':
      case 'canceled': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="myleave-page">
      <PageHeader
        title="My Leave"
        subtitle="View your leave balance, calendar and request history"
        actions={null}
      />

      {/* ── Top Layout: Donut Card + 3 Buttons (Left) | Calendar Card (Right) ── */}
      <div className="myleave-top">
        {/* Left Column: Donut Card + 3 Action Buttons directly below */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            title="My Leave Balance"
            actions={
              <Button size="sm" variant="ghost" leftIcon={<RiRefreshLine />} onClick={refreshBalance}>
                Refresh
              </Button>
            }
          >
            <LeaveBalanceCard balances={balances} dashData={dashData} loading={loadingBalance} />
          </Card>

          {/* 3 Blue Buttons stacked vertically with generous gap between donut and each button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 20 }}>
            <Button
              fullWidth
              variant="primary"
              leftIcon={<RiAddLine />}
              onClick={() => setApplyOpen(true)}
              style={{ background: '#0f4c81', borderColor: '#0f4c81', color: '#ffffff', padding: '14px 20px', fontWeight: 600, fontSize: '15px' }}
            >
              Request Leave
            </Button>
            <Button
              fullWidth
              variant="primary"
              leftIcon={<RiHistoryLine />}
              onClick={() => document.getElementById('myleave-history')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: '#0f4c81', borderColor: '#0f4c81', color: '#ffffff', padding: '14px 20px', fontWeight: 600, fontSize: '15px' }}
            >
              Leave History
            </Button>
            <Button
              fullWidth
              variant="primary"
              leftIcon={<RiFileTextLine />}
              onClick={() => setPolicyModalOpen(true)}
              style={{ background: '#0f4c81', borderColor: '#0f4c81', color: '#ffffff', padding: '14px 20px', fontWeight: 600, fontSize: '15px' }}
            >
              Leave Policy Summary
            </Button>
          </div>
        </div>

        {/* Right Column: Calendar Card aligned beside left column */}
        <Card title="Calendar">
          <LeaveCalendar leaves={allLeaves} holidays={holidays} />
        </Card>
      </div>

      {/* ── Leave Request Table ── */}
      <div id="myleave-history" style={{ marginTop: 14 }}>
        <Card title="My Leave Requests" padding={false}>
          {/* Filter Bar: Request Type | Request Status | Requested For */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            alignItems: 'end'
          }}>
            {/* Request Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Request Type
              </label>
              <Select
                name="type_filter"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                options={[
                  { label: 'All Leave Types', value: '' },
                  ...leaveTypesList.map((t) => ({ label: t.name, value: t.id })),
                ]}
              />
            </div>

            {/* Request Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Request Status
              </label>
              <Select
                name="status_filter"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Rejected', value: 'rejected' },
                  { label: 'Cancelled', value: 'cancelled' },
                ]}
              />
            </div>

            {/* Requested For */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Requested For
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-base)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                {monthFilter && (
                  <button
                    type="button"
                    onClick={() => { setMonthFilter(''); setPage(1); }}
                    title="Clear month filter"
                    style={{
                      position: 'absolute',
                      right: 8,
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Action Taken</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingTable ? (
                  <TableRowSkeleton cols={9} rows={8} />
                ) : displayLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        title="No leave requests"
                        description="No leave requests matching your selected filters."
                        action={
                          <Button size="sm" leftIcon={<RiAddLine />} onClick={() => setApplyOpen(true)}>
                            Apply Now
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  displayLeaves.map((l) => {
                    const statusNorm = String(l.status ?? '').toLowerCase();
                    const displayReason = (
                      (l.reason && String(l.reason).trim() !== '') ? l.reason :
                      (l.cancellation_reason && String(l.cancellation_reason).trim() !== '') ? `Cancelled: ${l.cancellation_reason}` :
                      (l.remarks && String(l.remarks).trim() !== '') ? l.remarks :
                      (l.description && String(l.description).trim() !== '') ? l.description :
                      (l.leave_type?.name ? `${l.leave_type.name} Application` : 'Leave Request')
                    );
                    return (
                      <tr key={l.id} className="table-row-hover" style={{ cursor: 'pointer' }} onClick={() => setDetailLeave(l)}>
                        <td style={{ fontWeight: 500 }}>{l.leave_type?.name}</td>
                        <td>{formatDate(l.start_date)}</td>
                        <td>{formatDate(l.end_date)}</td>
                        <td>{formatDays(l.working_days)}</td>
                        <td style={{ maxWidth: 220, whiteSpace: 'normal', wordBreak: 'break-word' }} title={displayReason}>
                          {displayReason}
                        </td>
                        <td>{formatDate(l.created_at)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Badge variant={getStatusVariant(l.status)} size="sm">
                            {l.status}
                          </Badge>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {statusNorm === 'pending' ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>Pending Action</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 'var(--font-size-xs)' }}>
                              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {statusNorm === 'approved' ? 'Approved' : statusNorm === 'rejected' ? 'Rejected' : 'Cancelled'}
                                {l.processed_by_name ? ` by ${l.processed_by_name}` : ''}
                              </span>
                              <span style={{ color: 'var(--color-text-muted)' }}>
                                {l.processed_at || l.updated_at ? formatDate(l.processed_at || l.updated_at) : '—'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {statusNorm === 'pending' ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelModalLeave(l);
                                setCancelReason('');
                              }}
                            >
                              Cancel
                            </Button>
                          ) : statusNorm === 'approved' ? (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled
                              title="Approved leaves can't be cancelled"
                              style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            >
                              Cancel
                            </Button>
                          ) : statusNorm === 'rejected' ? (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled
                              title="Rejected leaves can't be cancelled"
                              style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled
                              title="This leave request is already cancelled"
                              style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <Pagination
              meta={meta}
              page={page}
              onPageChange={setPage}
              perPage={perPage}
              onPerPageChange={setPerPage}
              perPageOptions={[5, 10, 15, 20, 'All']}
            />
          </div>
        </Card>
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title="Apply for Leave" size="lg">
        <ApplyLeaveForm onSuccess={handleApplySuccess} onCancel={() => setApplyOpen(false)} />
      </Modal>

      {/* Cancel Leave Confirmation Modal */}
      <Modal
        isOpen={!!cancelModalLeave}
        onClose={() => { if (!cancelling) setCancelModalLeave(null); }}
        title="Cancel Leave Request"
        size="md"
      >
        {cancelModalLeave && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to cancel your leave request for <strong>{cancelModalLeave.leave_type?.name}</strong> ({formatDate(cancelModalLeave.start_date)} to {formatDate(cancelModalLeave.end_date)})?
            </p>
            <div style={{ background: '#fffbe8', border: '1px solid #fde047', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 'var(--font-size-sm)', color: '#854d0e', fontWeight: 500 }}>
              ℹ️ Cancelling this leave request will automatically restore <strong>{formatDays(cancelModalLeave.working_days)} day(s)</strong> back to your leave balance.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                Cancellation Reason
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please enter a reason for cancelling this leave..."
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
              <Button variant="secondary" onClick={() => setCancelModalLeave(null)} disabled={cancelling}>
                No, Keep Request
              </Button>
              <Button
                variant="danger"
                loading={cancelling}
                onClick={handleConfirmCancel}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Leave'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Leave Policy Summary Modal */}
      <LeavePolicyModal isOpen={policyModalOpen} onClose={() => setPolicyModalOpen(false)} />

      {/* Leave Detail Modal */}
      {detailLeave && (
        <LeaveDetailModal
          leave={detailLeave}
          onClose={() => setDetailLeave(null)}
          onCancel={handleCancelLeave}
          showActions
        />
      )}
    </div>
  );
}
