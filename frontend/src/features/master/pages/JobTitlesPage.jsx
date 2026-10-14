/**
 * @file JobTitlesPage.jsx
 * @description Job Designation & Position Title Master Data Management Page.
 * Enables HR administrators to configure corporate job titles and designations.
 *
 * @module features/master/pages/JobTitlesPage
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
import * as jobTitleApi from '../../../api/jobTitleApi';
import { extractApiError, extractArray } from '../../../utils/helpers';
import toast from 'react-hot-toast';
import '../../leave/pages/LeavePage.css';

/* Backend returns/accepts { id, title, description } — NOT "name" */
function JobTitleForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title is required.' }); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        name="title"
        label="Job Title"
        value={form.title}
        onChange={handleChange}
        required
        error={errors.title}
        placeholder="e.g. Software Engineer"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Description (optional)</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="Brief description…"
          style={{
            padding: '10px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" loading={loading}>{initial ? 'Save Changes' : 'Create'}</Button>
      </div>
    </form>
  );
}

export default function JobTitlesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true);
    setError(null);
    jobTitleApi.getJobTitles({})
      .then((res) => setItems(extractArray(res)))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await jobTitleApi.updateJobTitle(editItem.id, formData);
        toast.success('Job title updated.');
      } else {
        await jobTitleApi.createJobTitle(formData);
        toast.success('Job title created.');
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
      await jobTitleApi.deleteJobTitle(deleteTarget.id);
      toast.success('Job title deleted.');
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
        title="Job Titles"
        subtitle="Manage job titles for grade-job-title combinations"
        actions={
          <Button leftIcon={<RiAddLine />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
            Add Job Title
          </Button>
        }
      />

      <Card padding={false}>
        {error ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-danger)' }}>
            <p style={{ marginBottom: 12 }}>{error}</p>
            <Button size="sm" variant="secondary" onClick={fetchItems}>Retry</Button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
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
                      <EmptyState
                        title="No job titles"
                        description="Add job titles that can be combined with grades."
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((jt) => (
                    <tr key={jt.id} className="table-row-hover">
                      <td style={{ fontWeight: 500 }}>{jt.title}</td>
                      <td className="cell-truncate">{jt.description ?? '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button
                            size="sm" variant="secondary" leftIcon={<RiPencilLine />}
                            onClick={() => { setEditItem(jt); setFormOpen(true); }}
                          >Edit</Button>
                          <Button
                            size="sm" variant="danger" leftIcon={<RiDeleteBinLine />}
                            onClick={() => setDeleteTarget(jt)}
                          >Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit Job Title' : 'Add Job Title'}
        size="md"
      >
        <JobTitleForm
          initial={editItem}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditItem(null); }}
          loading={submitting}
        />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Job Title"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
