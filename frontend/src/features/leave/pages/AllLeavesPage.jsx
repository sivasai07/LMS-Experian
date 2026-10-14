/**
 * @file AllLeavesPage.jsx
 * @description Organization-Wide Leave Request Audit & Governance Interface.
 * Provides HR administrators and executive personnel with comprehensive oversight over all employee leave requests
 * across departments, featuring status filters, instant search, action dropdowns with confirmation popups, and detail review modals.
 */

import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Badge from '../../../components/common/Badge/Badge';
import Button from '../../../components/common/Button/Button';
import Pagination from '../../../components/common/Pagination/Pagination';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import Select from '../../../components/common/Select/Select';
import Search from '../../../components/common/Search/Search';
import Modal from '../../../components/common/Modal/Modal';
import { TableRowSkeleton } from '../../../components/common/Skeleton/Skeleton';
import LeaveDetailModal from '../components/LeaveDetailModal';
import * as leaveApi from '../../../api/leaveApi';
import { LEAVE_STATUS, LEAVE_STATUS_COLORS } from '../../../constants/leaveStatus';
import { formatDate } from '../../../utils/date';
import { getLeaveEmployeeName, normalizeMeta } from '../../../utils/userHelpers';
import { extractApiError, formatDays, matchMultiWordStartsWith } from '../../../utils/helpers';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';
import '../pages/LeavePage.css';

const ACTION_DROPDOWN_OPTIONS = [
  { value: 'Approved', label: 'Approve' },
  { value: 'Rejected', label: 'Reject' },
];

export default function AllLeavesPage() {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const currentEmpId = user?.employee_id ?? user?.employee?.id;

  const [leaves, setLeaves] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailLeave, setDetailLeave] = useState(null);

  // Per-row dropdown action selection: { [leaveId]: 'Approved' | 'Rejected' }
  const [rowActions, setRowActions] = useState({});

  // Confirmation Modal State
  const [actionModalLeave, setActionModalLeave] = useState(null);
  const [actionModalType, setActionModalType] = useState('Approved');
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search);
  const { page, setPage, perPage, setPerPage } = usePagination();

  const fetchLeaves = useCallback(() => {
    setLoading(true);
    leaveApi.getAllLeaves({ page, per_page: perPage, status: statusFilter, search: debouncedSearch })
      .then((res) => {
        let list = res.data ?? [];
        if (debouncedSearch) {
          list = list.filter((l) => {
            const fName = l.employee?.first_name ?? '';
            const lName = l.employee?.last_name ?? '';
            const fullName = getLeaveEmployeeName(l);
            const ltName = l.leave_type?.name ?? '';

            return (
              matchMultiWordStartsWith(fName, debouncedSearch) ||
              matchMultiWordStartsWith(lName, debouncedSearch) ||
              matchMultiWordStartsWith(fullName, debouncedSearch) ||
              matchMultiWordStartsWith(ltName, debouncedSearch)
            );
          });
        }
        setLeaves(list);
        setMeta(normalizeMeta(res.meta));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, perPage, statusFilter, debouncedSearch]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleApprove = async (id, remarks) => {
    await leaveApi.approveLeave(id, { remarks });
    fetchLeaves();
    setDetailLeave(null);
    toast.success('Leave approved.');
  };

  const handleReject = async (id, remarks) => {
    await leaveApi.rejectLeave(id, { remarks });
    fetchLeaves();
    setDetailLeave(null);
    toast.success('Leave rejected.');
  };

  // Open confirmation modal when side tick button (✓) is clicked
  const handleOpenActionModal = (leave, actionType) => {
    setActionModalLeave(leave);
    setActionModalType(actionType);
    setActionRemarks('');
  };

  // Execute approval or rejection upon modal confirmation
  const handleConfirmAction = async () => {
    if (!actionModalLeave) return;
    setActionSubmitting(true);
    try {
      if (actionModalType === 'Approved') {
        await leaveApi.approveLeave(actionModalLeave.id, { remarks: actionRemarks });
        toast.success(`Leave request for ${getLeaveEmployeeName(actionModalLeave)} approved successfully.`);
      } else {
        await leaveApi.rejectLeave(actionModalLeave.id, { remarks: actionRemarks });
        toast.success(`Leave request for ${getLeaveEmployeeName(actionModalLeave)} rejected.`);
      }
      setActionModalLeave(null);
      setActionRemarks('');
      fetchLeaves();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setActionSubmitting(false);
    }
  };

  const statusOptions = Object.values(LEAVE_STATUS).map((s) => ({ value: s, label: s }));

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle="All employee leave requests" />

      <Card padding={false}>
        <div className="filter-row">
          <Search value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." />
          <Select
            name="status_filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={statusOptions}
            placeholder="All Statuses"
            className="filter-select"
          />
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Dept</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action Taken</th>
                <th>Details</th>
                <th>Decision / Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton cols={11} rows={8} />
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState title="No leave requests" description="No requests matching your filters." />
                  </td>
                </tr>
              ) : (
                leaves.map((l) => {
                  const selectedAction = rowActions[l.id] || 'Approved';
                  const isPending = String(l.status ?? '').toLowerCase() === 'pending';
                  const managerId = l.employee?.manager_id ?? l.user?.manager_id ?? l.employee?.manager?.id;
                  const isDirectManager = managerId && (
                    Number(managerId) === Number(currentUserId) ||
                    Number(managerId) === Number(currentEmpId)
                  );
                  const roleName = user?.role?.name ?? user?.role_name ?? '';
                  const isHrUser = roleName === 'HR' || roleName === 'Admin' || roleName === 'Super Admin';
                  const isNoManagerHrBypass = (!managerId || Number(managerId) === 0) && isHrUser;

                  const canPerformAction = isPending && (isDirectManager || isNoManagerHrBypass);
                  const displayReason = (
                    (l.reason && String(l.reason).trim() !== '') ? l.reason :
                    (l.cancellation_reason && String(l.cancellation_reason).trim() !== '') ? `Cancelled: ${l.cancellation_reason}` :
                    (l.remarks && String(l.remarks).trim() !== '') ? l.remarks :
                    (l.description && String(l.description).trim() !== '') ? l.description :
                    (l.leave_type?.name ? `${l.leave_type.name} Application` : 'Leave Request')
                  );

                  return (
                    <tr key={l.id} className="table-row-hover" onClick={() => setDetailLeave(l)} style={{ cursor: 'pointer' }}>
                      <td>{getLeaveEmployeeName(l)}</td>
                      <td>{l.employee?.department?.name ?? l.user?.department?.name}</td>
                      <td>{l.leave_type?.name}</td>
                      <td>{formatDate(l.start_date)}</td>
                      <td>{formatDate(l.end_date)}</td>
                      <td>{formatDays(l.working_days)}</td>
                      <td style={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }} title={displayReason}>{displayReason}</td>
                      <td>
                        <Badge variant={LEAVE_STATUS_COLORS[l.status] ?? 'default'} size="sm">
                          {l.status}
                        </Badge>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>Pending Action</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 'var(--font-size-xs)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {String(l.status).toLowerCase() === 'approved' ? 'Approved' : String(l.status).toLowerCase() === 'rejected' ? 'Rejected' : 'Cancelled'}
                              {l.processed_by_name ? ` by ${l.processed_by_name}` : ''}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {l.processed_at || l.updated_at ? formatDate(l.processed_at || l.updated_at) : '—'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => setDetailLeave(l)}>
                          View
                        </Button>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {canPerformAction ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Select
                              name={`action_${l.id}`}
                              value={selectedAction}
                              onChange={(e) => setRowActions((prev) => ({ ...prev, [l.id]: e.target.value }))}
                              options={ACTION_DROPDOWN_OPTIONS}
                              style={{ width: 105, padding: '4px 6px', fontSize: 13 }}
                            />
                            <Button
                              size="sm"
                              variant={selectedAction === 'Approved' ? 'success' : 'danger'}
                              title={`Click to ${selectedAction.toLowerCase()} this leave request`}
                              onClick={() => handleOpenActionModal(l, selectedAction)}
                              style={{ minWidth: 32, padding: '0 10px', fontWeight: 800 }}
                            >
                              ✓
                            </Button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>—</span>
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
          <Pagination meta={meta} page={page} onPageChange={setPage} perPage={perPage} onPerPageChange={setPerPage} perPageOptions={[5, 10, 15, 20, 'All']} />
        </div>
      </Card>

      {/* Action Confirmation Modal (Approve / Reject) */}
      <Modal
        isOpen={!!actionModalLeave}
        onClose={() => { if (!actionSubmitting) setActionModalLeave(null); }}
        title={`${actionModalType === 'Approved' ? 'Approve' : 'Reject'} Leave Request`}
        size="md"
      >
        {actionModalLeave && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to <strong>{actionModalType === 'Approved' ? 'approve' : 'reject'}</strong> the leave request for <strong>{getLeaveEmployeeName(actionModalLeave)}</strong> ({actionModalLeave.leave_type?.name}, {formatDate(actionModalLeave.start_date)} to {formatDate(actionModalLeave.end_date)})?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                {actionModalType === 'Approved' ? 'Remarks (Optional)' : 'Rejection Reason (Required)'}
              </label>
              <textarea
                rows={3}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder={actionModalType === 'Approved' ? 'Enter optional approval remarks...' : 'Please enter rejection reason...'}
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
              <Button variant="secondary" onClick={() => setActionModalLeave(null)} disabled={actionSubmitting}>
                Cancel
              </Button>
              <Button
                variant={actionModalType === 'Approved' ? 'success' : 'danger'}
                loading={actionSubmitting}
                onClick={handleConfirmAction}
              >
                {actionSubmitting ? 'Updating...' : `Yes, ${actionModalType === 'Approved' ? 'Approve' : 'Reject'}`}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {detailLeave && (
        <LeaveDetailModal
          leave={detailLeave}
          onClose={() => setDetailLeave(null)}
          onApprove={detailLeave.status === LEAVE_STATUS.PENDING ? handleApprove : undefined}
          onReject={detailLeave.status === LEAVE_STATUS.PENDING ? handleReject : undefined}
          showActions
        />
      )}
    </div>
  );
}
