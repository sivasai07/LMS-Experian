/**
 * @file LeaveDetailModal.jsx
 * @description Detailed Leave Application View & Processing Modal Component.
 * Displays full leave request attributes (employee name, date range, working days count, application reason,
 * single/multi-day half-day portion details, and approval/rejection/cancellation remarks), while exposing manager approval/rejection action forms.
 *
 * @module features/leave/components/LeaveDetailModal
 */

import { useState } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import Badge from '../../../components/common/Badge/Badge';
import Button from '../../../components/common/Button/Button';
import { LEAVE_STATUS_COLORS } from '../../../constants/leaveStatus';
import { formatDate, formatDateTime } from '../../../utils/date';
import { getLeaveEmployeeName } from '../../../utils/userHelpers';
import { formatDays } from '../../../utils/helpers';

/** Simple label–value row component */
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right', maxWidth: '65%', wordBreak: 'break-word' }}>{value ?? '—'}</span>
    </div>
  );
}

export default function LeaveDetailModal({ leave, onClose, onApprove, onReject, showActions }) {
  const [remarksInput, setRemarksInput] = useState('');

  if (!leave) return null;

  const statusNorm = String(leave.status ?? '').toLowerCase();
  const isPending = statusNorm === 'pending';
  const isApproved = statusNorm === 'approved';
  const isRejected = statusNorm === 'rejected';
  const isCancelled = statusNorm === 'cancelled' || statusNorm === 'canceled';
  const isProcessed = isApproved || isRejected || isCancelled;

  const isSingleDay = leave.start_date === leave.end_date;

  const displayApplicationReason = (
    (leave.reason && String(leave.reason).trim() !== '') ? leave.reason :
    (leave.cancellation_reason && String(leave.cancellation_reason).trim() !== '') ? leave.cancellation_reason :
    (leave.remarks && String(leave.remarks).trim() !== '') ? leave.remarks :
    (leave.leave_type?.name ? `${leave.leave_type.name} Application` : 'Leave Request')
  );

  const handleApprove = async () => {
    await onApprove?.(leave.id, remarksInput);
  };

  const handleReject = async () => {
    await onReject?.(leave.id, remarksInput);
  };

  return (
    <Modal isOpen onClose={onClose} title="Leave Request Details" size="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{leave.leave_type?.name ?? 'Leave Request'}</span>
        <Badge variant={LEAVE_STATUS_COLORS[leave.status] ?? LEAVE_STATUS_COLORS[statusNorm] ?? 'default'}>
          {leave.status}
        </Badge>
      </div>

      <InfoRow label="Employee" value={getLeaveEmployeeName(leave)} />
      <InfoRow label="Start Date" value={formatDate(leave.start_date)} />
      <InfoRow label="End Date" value={formatDate(leave.end_date)} />
      <InfoRow label="Working Days" value={`${formatDays(leave.working_days)} day(s)`} />
      
      {leave.is_half_day && (
        <>
          {isSingleDay ? (
            <InfoRow
              label="Half Day Portion"
              value={
                leave.half_day_type === 'first_half' || leave.start_half_day === 'first_half'
                  ? 'First Half (Morning 9 AM – 1 PM)'
                  : leave.half_day_type === 'second_half' || leave.start_half_day === 'second_half'
                  ? 'Second Half (Afternoon 1 PM – 5 PM)'
                  : 'Half Day'
              }
            />
          ) : (
            <>
              <InfoRow
                label="From Date Portion"
                value={
                  leave.start_half_day === 'second_half' || leave.half_day_type === 'second_half'
                    ? 'Second Half (Starts Afternoon 1 PM)'
                    : 'First Half (Full Working Day)'
                }
              />
              <InfoRow
                label="To Date Portion"
                value={
                  leave.end_half_day === 'first_half' || leave.half_day_type === 'first_half'
                    ? 'First Half (Ends Lunch 1 PM)'
                    : 'Second Half (Full Working Day)'
                }
              />
              <InfoRow label="Half Day Summary" value="Partial half day bounds applied on start/end dates" />
            </>
          )}
        </>
      )}

      <InfoRow label="Application Reason" value={displayApplicationReason} />
      <InfoRow label="Applied On" value={formatDateTime(leave.created_at)} />

      <InfoRow
        label="Processed By"
        value={
          leave.processed_by_name ||
          leave.approver_name ||
          (leave.processor ? `${leave.processor.first_name ?? ''} ${leave.processor.last_name ?? ''}`.trim() : null) ||
          (leave.canceller ? `${leave.canceller.first_name ?? ''} ${leave.canceller.last_name ?? ''}`.trim() : null) ||
          (leave.approver ? `${leave.approver.first_name ?? ''} ${leave.approver.last_name ?? ''}`.trim() : null) ||
          (leave.processed_by ? `${leave.processed_by.first_name ?? ''} ${leave.processed_by.last_name ?? ''}`.trim() : null) ||
          (isCancelled ? 'Employee (Self-Cancelled)' : isProcessed ? 'System Administrator' : 'Pending Manager Review')
        }
      />

      <InfoRow
        label="Processed At"
        value={
          leave.processed_at
            ? formatDateTime(leave.processed_at)
            : isProcessed && leave.updated_at
            ? formatDateTime(leave.updated_at)
            : 'Pending Processing'
        }
      />

      {/* Dedicated Remarks / Processing / Cancellation Reason Card */}
      {isProcessed && (
        <div style={{
          marginTop: 16,
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          background: isApproved ? '#f0fdf4' : isRejected ? '#fef2f2' : '#fffbe8',
          border: `1px solid ${isApproved ? '#bbf7d0' : isRejected ? '#fecaca' : '#fde047'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: isApproved ? '#166534' : isRejected ? '#991b1b' : '#854d0e'
          }}>
            {isCancelled ? 'Cancellation Reason' : isApproved ? 'Approval Remarks' : 'Rejection Reason'}
          </div>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.4
          }}>
            {leave.cancellation_reason || leave.remarks || 'No specific remarks provided.'}
          </div>
        </div>
      )}

      {/* Manager Action Buttons for Pending Requests */}
      {showActions && isPending && onApprove && onReject && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Approval / Rejection Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter remarks for the employee..."
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <Button variant="success" fullWidth onClick={handleApprove}>
                Approve Request
              </Button>
              <Button variant="danger" fullWidth onClick={handleReject}>
                Reject Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
