/**
 * @file LeaveTypesPage.jsx
 * @description Leave Type Configuration Master Data Management Page.
 * Allows HR administrators to define, edit, and manage organizational leave policy categories,
 * featuring multi-word starts-with search filtering, custom page size pagination, and detail popups.
 *
 * @module features/master/pages/LeaveTypesPage
 */

import { useCallback, useEffect, useState } from 'react';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiSearchLine, RiRefreshLine } from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Modal from '../../../components/common/Modal/Modal';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import Search from '../../../components/common/Search/Search';
import Pagination from '../../../components/common/Pagination/Pagination';
import { TableRowSkeleton } from '../../../components/common/Skeleton/Skeleton';
import toast from 'react-hot-toast';
import * as leaveApi from '../../../api/leaveApi';
import { extractApiError, extractArray, matchMultiWordStartsWith } from '../../../utils/helpers';
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

function LeaveTypeForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ name: initial?.name ?? '', description: initial?.description ?? '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((err) => ({ ...err, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name is required.' }); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input name="name" label="Leave Type Name" value={form.name} onChange={handleChange} required error={errors.name} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          style={{ padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" loading={loading}>{initial ? 'Save Changes' : 'Create'}</Button>
      </div>
    </form>
  );
}

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const { page, perPage, setPage, setPerPage } = usePagination(1, 10);

  const fetch = useCallback(() => {
    setLoading(true);
    leaveApi.getLeaveTypes({})
      .then((res) => setLeaveTypes(extractArray(res) ?? []))
      .catch(() => setLeaveTypes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, setPage]);

  // Multi-word starts-with filtering
  const filteredItems = leaveTypes.filter((lt) => {
    if (!debouncedSearch) return true;
    return matchMultiWordStartsWith(lt.name, debouncedSearch) || matchMultiWordStartsWith(lt.code, debouncedSearch);
  });

  // Client-side pagination calculations
  const total = filteredItems.length;
  const currentPerPage = perPage === 1000 ? (total > 0 ? total : 1000) : perPage;
  const last_page = Math.ceil(total / currentPerPage) || 1;
  const pagedItems = perPage === 1000
    ? filteredItems
    : filteredItems.slice((page - 1) * currentPerPage, page * currentPerPage);

  const meta = {
    current_page: page,
    from: total > 0 ? (page - 1) * currentPerPage + 1 : 0,
    to: Math.min(page * currentPerPage, total),
    per_page: currentPerPage,
    total,
    last_page,
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await leaveApi.updateLeaveType(editItem.id, form);
        toast.success('Leave type updated.');
      } else {
        await leaveApi.createLeaveType(form);
        toast.success('Leave type created.');
      }
      setFormOpen(false);
      setEditItem(null);
      fetch();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await leaveApi.deleteLeaveType(deleteTarget.id);
      toast.success('Leave type deleted.');
      setDeleteTarget(null);
      fetch();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Leave Types"
        subtitle="Configure available leave types and allocation rules"
        actions={
          <Button leftIcon={<RiAddLine />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
            Add Leave Type
          </Button>
        }
      />

      <Card padding={false}>
        <div className="filter-row">
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by leave type name..."
            style={{ flex: 1, minWidth: 220 }}
          />
          <Button variant="ghost" leftIcon={<RiRefreshLine />} onClick={fetch} title="Refresh">
            Refresh
          </Button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton cols={3} rows={6} />
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState icon={<RiSearchLine />} title="No leave types found" description="No leave types matching your search query." />
                  </td>
                </tr>
              ) : (
                pagedItems.map((lt) => (
                  <tr
                    key={lt.id}
                    className="table-row-hover"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDetail(lt)}
                    title="Click to view leave type details"
                  >
                    <td style={{ fontWeight: 500 }}>{lt.name}</td>
                    <td className="cell-truncate">{lt.description ?? '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button size="sm" variant="secondary" leftIcon={<RiPencilLine />} onClick={() => { setEditItem(lt); setFormOpen(true); }}>Edit</Button>
                        <Button size="sm" variant="danger" leftIcon={<RiDeleteBinLine />} onClick={() => setDeleteTarget(lt)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Leave Type Details Popup Modal (No bottom close button) */}
      {selectedDetail && (
        <Modal
          isOpen={Boolean(selectedDetail)}
          onClose={() => setSelectedDetail(null)}
          title="Leave Type Category Details"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DetailRow label="Leave Type Name" value={selectedDetail.name} />
            <DetailRow label="System Code" value={selectedDetail.code ?? `LT-${selectedDetail.id}`} />
            <DetailRow label="Description" value={selectedDetail.description} />
          </div>
        </Modal>
      )}

      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} title={editItem ? 'Edit Leave Type' : 'Add Leave Type'} size="md">
        <LeaveTypeForm initial={editItem} onSubmit={handleSubmit} onCancel={() => { setFormOpen(false); setEditItem(null); }} loading={submitting} />
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Leave Type" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
