/**
 * @file TeamPage.jsx
 * @description Direct Reports & Team Roster Directory View.
 * Enables managers and HR to inspect member details of their direct reporting team,
 * featuring interactive user details popups, multi-word starts-with search filters, and custom page size pagination.
 *
 * @module features/employee/pages/TeamPage
 */

import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Avatar from '../../../components/common/Avatar/Avatar';
import Badge from '../../../components/common/Badge/Badge';
import Search from '../../../components/common/Search/Search';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import Pagination from '../../../components/common/Pagination/Pagination';
import Modal from '../../../components/common/Modal/Modal';
import { TableRowSkeleton } from '../../../components/common/Skeleton/Skeleton';
import * as userApi from '../../../api/userApi';
import { formatDate } from '../../../utils/date';
import { getFullName } from '../../../utils/userHelpers';
import { capitalise, matchMultiWordStartsWith } from '../../../utils/helpers';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import '../../leave/pages/LeavePage.css';

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [selectedMember, setSelectedMember] = useState(null);

  const { page, perPage, setPage, setPerPage } = usePagination(1, 10);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.getTeam({});
      let list = Array.isArray(res.data?.data) ? res.data.data
                 : Array.isArray(res.data)       ? res.data
                 : Array.isArray(res)            ? res
                 : [];

      // Multi-word starts-with filtering for First Name, Last Name, Full Name, Email, or Employee Number
      if (debouncedSearch) {
        list = list.filter((u) => {
          const fullName = getFullName(u);
          return (
            matchMultiWordStartsWith(u.first_name, debouncedSearch) ||
            matchMultiWordStartsWith(u.last_name, debouncedSearch) ||
            matchMultiWordStartsWith(fullName, debouncedSearch) ||
            matchMultiWordStartsWith(u.email, debouncedSearch) ||
            matchMultiWordStartsWith(u.employee_number, debouncedSearch)
          );
        });
      }

      setMembers(list);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, setPage]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const storageBase = import.meta.env.VITE_STORAGE_URL ?? 'http://localhost:8000/storage';

  // Client-side pagination calculations
  const total = members.length;
  const currentPerPage = perPage === 1000 ? (total > 0 ? total : 1000) : perPage;
  const last_page = Math.ceil(total / currentPerPage) || 1;
  const pagedMembers = perPage === 1000
    ? members
    : members.slice((page - 1) * currentPerPage, page * currentPerPage);

  const meta = {
    current_page: page,
    from: total > 0 ? (page - 1) * currentPerPage + 1 : 0,
    to: Math.min(page * currentPerPage, total),
    per_page: currentPerPage,
    total,
    last_page,
  };

  return (
    <div className="team-page">
      <PageHeader title="My Team" subtitle="View your direct reports and department team roster." />

      <Card padding={false}>
        <div className="filter-row">
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by first name or last name..."
            style={{ flex: 1, minWidth: 220 }}
          />
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Grade</th>
                <th>Date Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton cols={6} rows={8} />
              ) : pagedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No team members found" description="No team members matching your search query." />
                  </td>
                </tr>
              ) : (
                pagedMembers.map((u) => {
                  const fullName = getFullName(u);
                  const statusVal = typeof u.status === 'object' ? u.status?.value : u.status;
                  const photoUrl = u.profile_photo ? `${storageBase}/${u.profile_photo}` : null;
                  const jobTitle = u.job_title?.title ?? u.gradeJobTitle?.jobTitle?.title ?? '—';
                  const gradeCode = u.grade?.code ?? u.gradeJobTitle?.grade?.code ?? '—';

                  return (
                    <tr
                      key={u.id}
                      className="table-row-hover"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedMember(u)}
                      title="Click to view full team member details"
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={fullName} src={photoUrl} size="sm" />
                          <div>
                            <div style={{ fontWeight: 500 }}>{fullName}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.department?.name ?? '—'}</td>
                      <td>{jobTitle}</td>
                      <td>{gradeCode}</td>
                      <td>{formatDate(u.joining_date ?? u.created_at)}</td>
                      <td>
                        <Badge variant={statusVal === 'active' || statusVal === 'Active' ? 'success' : 'default'} size="sm">
                          {statusVal ?? 'Active'}
                        </Badge>
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

      {/* Team Member Profile Details Popup Modal (No bottom Close button) */}
      {selectedMember && (
        <Modal
          isOpen={Boolean(selectedMember)}
          onClose={() => setSelectedMember(null)}
          title="Team Member Profile Details"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
              <Avatar name={getFullName(selectedMember)} size="lg" />
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                  {getFullName(selectedMember)}
                </h3>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  {selectedMember.email}
                </span>
                <div style={{ marginTop: 4 }}>
                  <Badge variant={selectedMember.role?.name === 'Manager' ? 'warning' : 'default'} size="sm">
                    {selectedMember.role?.name ?? 'Employee'}
                  </Badge>
                </div>
              </div>
            </div>

            <DetailRow label="Employee ID" value={selectedMember.employee_number || `EMP-${String(selectedMember.id).padStart(3, '0')}`} />
            <DetailRow label="Department" value={selectedMember.department?.name} />
            <DetailRow label="Job Title" value={selectedMember.job_title?.title ?? selectedMember.gradeJobTitle?.jobTitle?.title} />
            <DetailRow label="Grade Level" value={selectedMember.grade?.code ?? selectedMember.gradeJobTitle?.grade?.code} />
            <DetailRow label="Contact Phone" value={selectedMember.phone} />
            <DetailRow label="Gender" value={selectedMember.gender ? capitalise(String(typeof selectedMember.gender === 'object' ? selectedMember.gender?.value : selectedMember.gender)) : '—'} />
            <DetailRow label="Date Joined" value={formatDate(selectedMember.joining_date ?? selectedMember.created_at)} />
            <DetailRow label="Employment Status" value={selectedMember.status ?? 'Active'} />
          </div>
        </Modal>
      )}
    </div>
  );
}
