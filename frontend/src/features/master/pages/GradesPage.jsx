/**
 * @file GradesPage.jsx
 * @description Salary Grade & Level Master Data Management Page.
 * Enables HR administrators to configure job grade tiers and level definitions.
 *
 * @module features/master/pages/GradesPage
 */

import { useCallback, useEffect, useState } from 'react';
import { RiAddLine, RiPencilLine, RiDeleteBinLine } from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import { TableRowSkeleton } from '../../../components/common/Skeleton/Skeleton';
import * as gradeApi from '../../../api/gradeApi';
import { extractApiError, extractArray } from '../../../utils/helpers';
import toast from 'react-hot-toast';
import '../../leave/pages/LeavePage.css';

function GradeForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    description: initial?.description ?? '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code.trim()) { setErrors({ code: 'Grade code is required.' }); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input name="code" label="Grade Code (e.g. G1, G2)" value={form.code} onChange={handleChange} required error={errors.code} />
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

export default function GradesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true);
    gradeApi.getGrades({})
      .then((res) => setItems(extractArray(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await gradeApi.updateGrade(editItem.id, form);
        toast.success('Grade updated.');
      } else {
        await gradeApi.createGrade(form);
        toast.success('Grade created.');
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
      await gradeApi.deleteGrade(deleteTarget.id);
      toast.success('Grade deleted.');
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
        title="Grades"
        subtitle="Manage employee grades"
        actions={
          <Button leftIcon={<RiAddLine />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
            Add Grade
          </Button>
        }
      />

      <Card padding={false}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Grade Code</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton cols={3} rows={6} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState title="No grades" description="Add your first grade." />
                  </td>
                </tr>
              ) : (
                items.map((g) => (
                  <tr key={g.id} className="table-row-hover">
                    <td style={{ fontWeight: 500 }}>{g.code}</td>
                    <td className="cell-truncate">{g.description ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button size="sm" variant="secondary" leftIcon={<RiPencilLine />} onClick={() => { setEditItem(g); setFormOpen(true); }}>Edit</Button>
                        <Button size="sm" variant="danger" leftIcon={<RiDeleteBinLine />} onClick={() => setDeleteTarget(g)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} title={editItem ? 'Edit Grade' : 'Add Grade'} size="md">
        <GradeForm initial={editItem} onSubmit={handleSubmit} onCancel={() => { setFormOpen(false); setEditItem(null); }} loading={submitting} />
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Grade" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Delete <strong>{deleteTarget?.code}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
