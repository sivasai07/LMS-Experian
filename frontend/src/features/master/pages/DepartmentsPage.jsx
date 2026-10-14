/**
 * @file DepartmentsPage.jsx
 * @description Department Master Data Management Page.
 * Enables HR administrators to create, edit, search (multi-word starts-with filtering), and delete organizational departments,
 * featuring custom page size pagination and detail popups.
 *
 * @module features/master/pages/DepartmentsPage
 */

import { useCallback, useEffect, useState } from 'react';
import { RiAddLine, RiPencilLine, RiDeleteBinLine } from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import Search from '../../../components/common/Search/Search';
import { TableRowSkeleton } from '../../../components/common/Skeleton/Skeleton';
import Pagination from '../../../components/common/Pagination/Pagination';
import * as departmentApi from '../../../api/departmentApi';
import { extractApiError, extractArray, matchMultiWordStartsWith } from '../../../utils/helpers';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import toast from 'react-hot-toast';
import '../../leave/pages/LeavePage.css';

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  );
}

function DeptForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ name: initial?.name ?? '', description: initial?.description ?? '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name is required.' }); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input name="name" label="Department Name" value={form.name} onChange={handleChange} required error={errors.name} />
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

export default function DepartmentsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const { page, setPage, perPage, setPerPage } = usePagination();

  const fetchItems = useCallback(() => {
    setLoading(true);
    departmentApi.getDepartments({ page, per_page: perPage, search: debouncedSearch })
      .then((res) => {
        let list = extractArray(res) ?? [];

        // Multi-word starts-with search filtering
        if (debouncedSearch) {
          list = list.filter((d) => matchMultiWordStartsWith(d.name, debouncedSearch));
        }

        setItems(list);
        setMeta(res.meta);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, perPage, debouncedSearch]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await departmentApi.updateDepartment(editItem.id, form);
        toast.success('Department updated.');
      } else {
        await departmentApi.createDepartment(form);
        toast.success('Department created.');
      }
      setFormOpen(false);
      setEditItem(null);
      fetchItems();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await departmentApi.deleteDepartment(deleteTarget.id);
      toast.success('Department deleted.');
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage company departments and organizational divisions"
        actions={
          <Button leftIcon={<RiAddLine />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
            Add Department
          </Button>
        }
      />

      <Card padding={false}>
        <div className="filter-row">
          <Search value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search departments..." />
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
                <TableRowSkeleton cols={3} rows={8} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState title="No departments found" description="Create your first department or refine your search." />
                  </td>
                </tr>
              ) : (
                items.map((d) => (
                  <tr
                    key={d.id}
                    className="table-row-hover"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDetail(d)}
                    title="Click to view department details"
                  >
                    <td style={{ fontWeight: 500 }}>{d.name}</td>
                    <td className="cell-truncate">{d.description ?? '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button size="sm" variant="secondary" leftIcon={<RiPencilLine />} onClick={() => { setEditItem(d); setFormOpen(true); }}>Edit</Button>
                        <Button size="sm" variant="danger" leftIcon={<RiDeleteBinLine />} onClick={() => setDeleteTarget(d)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 16px' }}>
          <Pagination meta={meta} page={page} onPageChange={setPage} perPage={perPage} onPerPageChange={setPerPage} perPageOptions={[5, 10, 15, 20, 'All']} />
        </div>
      </Card>

      {/* Department Details Popup Modal (No bottom close button) */}
      {selectedDetail && (
        <Modal
          isOpen={Boolean(selectedDetail)}
          onClose={() => setSelectedDetail(null)}
          title="Department Profile Details"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DetailRow label="Department Name" value={selectedDetail.name} />
            <DetailRow label="Department Code" value={selectedDetail.code ?? `DEPT-${selectedDetail.id}`} />
            <DetailRow label="Description" value={selectedDetail.description} />
          </div>
        </Modal>
      )}

      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} title={editItem ? 'Edit Department' : 'Add Department'} size="md">
        <DeptForm initial={editItem} onSubmit={handleSubmit} onCancel={() => { setFormOpen(false); setEditItem(null); }} loading={submitting} />
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Department" size="sm"
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
