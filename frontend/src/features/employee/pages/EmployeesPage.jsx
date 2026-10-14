/**
 * @file EmployeesPage.jsx
 * @description Organization Employee Directory & Account Administration Page.
 * Enables HR administrators to manage employee user accounts, create new staff profiles, edit existing credentials,
 * soft-delete or restore accounts, filter by department or role, toggle deactivated users, select custom page sizes (5/10/15/20/All),
 * and view employee IDs & reporting managers.
 *
 * @module features/employee/pages/EmployeesPage
 */

import { useCallback, useEffect, useState } from 'react';
import {
  RiAddLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiSearchLine,
  RiRestartLine,
} from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Badge from '../../../components/common/Badge/Badge';
import Avatar from '../../../components/common/Avatar/Avatar';
import Pagination from '../../../components/common/Pagination/Pagination';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import Search from '../../../components/common/Search/Search';
import Select from '../../../components/common/Select/Select';
import { TableRowSkeleton } from '../../../components/common/Skeleton/Skeleton';
import Modal from '../../../components/common/Modal/Modal';
import UserFormModal from '../components/UserFormModal';
import * as userApi from '../../../api/userApi';
import * as departmentApi from '../../../api/departmentApi';
import { formatDate } from '../../../utils/date';
import { getFullName, normalizeMeta } from '../../../utils/userHelpers';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';
import { capitalise, extractApiError, matchMultiWordStartsWith } from '../../../utils/helpers';
import '../../leave/pages/LeavePage.css';

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  );
}

const ROLE_OPTIONS = [
  { value: 'HR', label: 'HR' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Employee', label: 'Employee' },
];

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [restoringUser, setRestoringUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const { page, perPage, setPage, setPerPage } = usePagination(1, 10);

  // Load departments for filter dropdown
  useEffect(() => {
    departmentApi
      .getDepartments()
      .then((res) => setDepartments(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(deptFilter && { department_id: deptFilter }),
        ...(roleFilter && { role: roleFilter }),
        ...(showDeleted && { with_trashed: true, show_deleted: true }),
      };
      const res = await userApi.getUsers(params);

      let list = [];
      let rawMeta = null;

      if (Array.isArray(res.data?.data)) {
        list = res.data.data;
        rawMeta = res.data;
      } else if (Array.isArray(res.data)) {
        list = res.data;
        rawMeta = res.meta;
      } else if (Array.isArray(res)) {
        list = res;
      }

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

      setUsers(list);
      setMeta(normalizeMeta(rawMeta));

      // Keep selectedUser and editingUser updated with fresh data
      setSelectedUser((prev) => {
        if (!prev) return null;
        const match = list.find((item) => item.id === prev.id);
        return match ?? prev;
      });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, deptFilter, roleFilter, showDeleted]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, deptFilter, roleFilter, showDeleted, perPage, setPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleOpenEdit = async (user) => {
    try {
      const res = await userApi.getUser(user.id);
      const fullUser = res.data ?? res;
      setEditingUser(fullUser);
    } catch {
      setEditingUser(user);
    }
    setModalOpen(true);
  };

  const handleFormSuccess = (updatedUser) => {
    setModalOpen(false);
    setEditingUser(null);
    if (updatedUser && typeof updatedUser === 'object' && updatedUser.id) {
      setSelectedUser(updatedUser);
    }
    fetchUsers();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await userApi.deleteUser(deletingUser.id);
      toast.success(`${getFullName(deletingUser)} deactivated successfully.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!restoringUser) return;
    setRestoring(true);
    try {
      await userApi.restoreUser(restoringUser.id);
      toast.success(`${getFullName(restoringUser)} restored successfully.`);
      setRestoringUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setRestoring(false);
    }
  };

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  return (
    <div className="employees-page">
      <PageHeader
        title="Employees"
        subtitle="Manage user accounts, roles, and departmental assignments."
        actions={
          <Button leftIcon={<RiAddLine />} onClick={handleOpenAdd}>
            Add Employee
          </Button>
        }
      />

      <Card padding={false}>
        {/* Filters */}
        <div className="filter-row" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            options={deptOptions}
            placeholder="All Departments"
            style={{ width: 170 }}
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={ROLE_OPTIONS}
            placeholder="All Roles"
            style={{ width: 130 }}
          />
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: showDeleted ? 'var(--color-bg)' : 'transparent',
              border: showDeleted ? '1px solid var(--color-border)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                cursor: 'pointer',
                accentColor: 'var(--color-primary)',
              }}
            />
            <span>Show Deactivated</span>
          </label>
          <Button variant="ghost" leftIcon={<RiRefreshLine />} onClick={fetchUsers} title="Refresh">
            Refresh
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Grade / Title</th>
                  <th>Reporting Manager</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton cols={8} rows={5} />
              </tbody>
            </table>
          </div>
        ) : error ? (
          <EmptyState
            title="Error loading employees"
            description={error}
            action={
              <Button size="sm" onClick={fetchUsers}>
                Retry
              </Button>
            }
          />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<RiSearchLine />}
            title="No employees found"
            description="Try clearing search or filter parameters."
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                Add First Employee
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Grade / Title</th>
                    <th>Reporting Manager</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const fullName = getFullName(u);
                    const roleName = u.role?.name ?? '—';
                    const deptName = u.department?.name ?? '—';

                    // Robust extraction for Grade & Job Title matter
                    const gradeCode =
                      u.grade?.code ||
                      u.grade?.name ||
                      u.gradeJobTitle?.grade?.code ||
                      u.gradeJobTitle?.grade?.name ||
                      u.grade_job_title?.grade?.code ||
                      u.grade_job_title?.grade?.name;

                    const jobTitleName =
                      u.job_title?.title ||
                      u.job_title?.name ||
                      u.gradeJobTitle?.jobTitle?.title ||
                      u.gradeJobTitle?.jobTitle?.name ||
                      u.grade_job_title?.job_title?.title ||
                      u.grade_job_title?.job_title?.name;

                    const gradeTitleParts = [gradeCode, jobTitleName].filter(Boolean);
                    const gradeTitle = gradeTitleParts.length > 0 ? gradeTitleParts.join(' / ') : '—';

                    const isDeactivated = Boolean(u.deleted_at) || u.status === 'inactive' || u.status === 'Inactive';
                    const isSelf = currentUser?.id === u.id;
                    const managerName = u.manager ? getFullName(u.manager) : (u.manager_name || '—');

                    return (
                      <tr
                        key={u.id}
                        className="table-row-hover"
                        style={{ opacity: isDeactivated ? 0.75 : 1, cursor: 'pointer' }}
                        onClick={() => setSelectedUser(u)}
                        title="Click to view full employee details"
                      >
                        <td>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              color: 'var(--color-text-muted)',
                              fontSize: '12px',
                            }}
                          >
                            {u.employee_number || `EMP-${String(u.id).padStart(3, '0')}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={fullName} size="sm" />
                            <div>
                              <div style={{ fontWeight: 500 }}>
                                {fullName}
                                {isSelf && (
                                  <span style={{ marginLeft: 6, fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                    (You)
                                  </span>
                                )}
                                {isDeactivated && (
                                  <span style={{ marginLeft: 6, fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600 }}>
                                    (Deactivated)
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{deptName}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Badge variant={roleName === 'HR' ? 'primary' : roleName === 'Manager' ? 'warning' : 'default'}>
                              {roleName}
                            </Badge>
                            {isDeactivated && <Badge variant="danger">Inactive</Badge>}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: gradeTitle !== '—' ? 500 : 400 }}>
                            {gradeTitle}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: managerName === '—' ? 'var(--color-text-muted)' : 'inherit', fontSize: 'var(--font-size-sm)' }}>
                            {managerName}
                          </span>
                        </td>
                        <td>{formatDate(u.joining_date ?? u.created_at)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<RiPencilLine />}
                              onClick={() => handleOpenEdit(u)}
                              title="Edit user details"
                            />
                            {isDeactivated && (
                              <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={<RiRestartLine />}
                                onClick={() => setRestoringUser(u)}
                                title="Restore employee account"
                                style={{ color: 'var(--color-success)' }}
                              />
                            )}
                            {!isSelf && (
                              <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={<RiDeleteBinLine />}
                                onClick={() => setDeletingUser(u)}
                                title={isDeactivated ? 'Delete permanently' : 'Deactivate employee'}
                                style={{ color: 'var(--color-danger)' }}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
          </>
        )}
      </Card>

      {/* Employee Profile Details Popup Modal (No bottom close button) */}
      {selectedUser && (
        <Modal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title="Employee Profile Details"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
              <Avatar name={getFullName(selectedUser)} size="lg" />
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                  {getFullName(selectedUser)}
                </h3>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  {selectedUser.email}
                </span>
                <div style={{ marginTop: 4 }}>
                  <Badge variant={selectedUser.role?.name === 'HR' ? 'primary' : selectedUser.role?.name === 'Manager' ? 'warning' : 'default'} size="sm">
                    {selectedUser.role?.name ?? 'Employee'}
                  </Badge>
                </div>
              </div>
            </div>

            <DetailRow label="Employee ID" value={selectedUser.employee_number || `EMP-${String(selectedUser.id).padStart(3, '0')}`} />
            <DetailRow label="Department" value={selectedUser.department?.name} />
            <DetailRow label="Job Title" value={selectedUser.job_title?.title ?? selectedUser.gradeJobTitle?.jobTitle?.title} />
            <DetailRow label="Grade Level" value={selectedUser.grade?.code ?? selectedUser.gradeJobTitle?.grade?.code} />
            <DetailRow label="Reporting Manager" value={selectedUser.manager ? getFullName(selectedUser.manager) : (selectedUser.manager_name || '—')} />
            <DetailRow label="Contact Phone" value={selectedUser.phone} />
            <DetailRow label="Gender" value={selectedUser.gender ? capitalise(String(typeof selectedUser.gender === 'object' ? selectedUser.gender?.value : selectedUser.gender)) : '—'} />
            <DetailRow label="Date Joined" value={formatDate(selectedUser.joining_date ?? selectedUser.created_at)} />
            <DetailRow label="Employment Status" value={selectedUser.status ?? 'Active'} />
          </div>
        </Modal>
      )}

      {/* Form Modal */}
      {modalOpen && (
        <UserFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleFormSuccess}
          user={editingUser}
        />
      )}

      {/* Deactivate Confirmation Dialog */}
      {deletingUser && (
        <Modal
          isOpen={Boolean(deletingUser)}
          onClose={() => setDeletingUser(null)}
          title="Deactivate Employee"
          size="sm"
        >
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            Are you sure you want to deactivate <strong>{getFullName(deletingUser)}</strong>? They will no longer be able to log in.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setDeletingUser(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteConfirm}>
              {deleting ? 'Deactivating...' : 'Deactivate Account'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Restore Confirmation Dialog */}
      {restoringUser && (
        <Modal
          isOpen={Boolean(restoringUser)}
          onClose={() => setRestoringUser(null)}
          title="Restore Employee Account"
          size="sm"
        >
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            Are you sure you want to restore <strong>{getFullName(restoringUser)}</strong>? Their account and access will be re-activated.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setRestoringUser(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button variant="success" loading={restoring} onClick={handleRestoreConfirm}>
              {restoring ? 'Restoring...' : 'Restore Account'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
