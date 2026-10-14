/**
 * @file GradeJobTitlesPage.jsx
 * @description Grade & Job Title Mapping Master Data Management Page.
 * Manages the many-to-many relationship mappings between corporate Grade Levels (G1, G2, G3...)
 * and Job Designation Positions (Software Engineer, HR Executive, Manager...).
 * Features full CRUD actions (Add, Edit, Delete), multi-word starts-with search, custom pagination, and row-click detail popups.
 *
 * @module features/master/pages/GradeJobTitlesPage
 */

import { useCallback, useEffect, useState } from 'react';
import {
  RiAddLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiRefreshLine,
  RiBarChartLine,
  RiBriefcaseLine,
} from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Badge from '../../../components/common/Badge/Badge';
import Select from '../../../components/common/Select/Select';
import Modal from '../../../components/common/Modal/Modal';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import Search from '../../../components/common/Search/Search';
import Pagination from '../../../components/common/Pagination/Pagination';
import { TableRowSkeleton } from '../../../components/common/Skeleton/Skeleton';
import * as gradeJobTitleApi from '../../../api/gradeJobTitleApi';
import * as gradeApi from '../../../api/gradeApi';
import * as jobTitleApi from '../../../api/jobTitleApi';
import { extractApiError, extractArray, matchMultiWordStartsWith } from '../../../utils/helpers';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
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

function GradeJobTitleForm({ initial, grades, jobTitles, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    grade_id: initial?.grade_id ?? initial?.grade?.id ?? '',
    job_title_id: initial?.job_title_id ?? initial?.jobTitle?.id ?? initial?.job_title?.id ?? '',
  });
  const [errors, setErrors] = useState({});

  const gradeOpts = grades.map((g) => ({ value: g.id, label: `${g.code ?? g.name} — ${g.name ?? ''}` }));
  const jobOpts = jobTitles.map((j) => ({ value: j.id, label: j.title ?? j.name }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.grade_id) errs.grade_id = 'Grade is required.';
    if (!form.job_title_id) errs.job_title_id = 'Job Title is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Select
        name="grade_id"
        label="Grade Level"
        value={form.grade_id}
        onChange={(e) => { setForm((f) => ({ ...f, grade_id: e.target.value })); setErrors((err) => ({ ...err, grade_id: null })); }}
        options={gradeOpts}
        placeholder="Select Grade Level"
        required
        error={errors.grade_id}
      />
      <Select
        name="job_title_id"
        label="Job Title / Designation"
        value={form.job_title_id}
        onChange={(e) => { setForm((f) => ({ ...f, job_title_id: e.target.value })); setErrors((err) => ({ ...err, job_title_id: null })); }}
        options={jobOpts}
        placeholder="Select Job Title"
        required
        error={errors.job_title_id}
      />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" loading={loading}>{initial ? 'Save Mapping' : 'Create Mapping'}</Button>
      </div>
    </form>
  );
}

export default function GradeJobTitlesPage() {
  const [items, setItems] = useState([]);
  const [grades, setGrades] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { page, perPage, setPage, setPerPage } = usePagination(1, 10);

  const fetchMasters = useCallback(async () => {
    try {
      const [gRes, jRes] = await Promise.all([
        gradeApi.getGrades({}),
        jobTitleApi.getJobTitles({}),
      ]);
      setGrades(extractArray(gRes) ?? []);
      setJobTitles(extractArray(jRes) ?? []);
    } catch { /* silent */ }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gradeJobTitleApi.getGradeJobTitles();
      let list = extractArray(res) ?? [];
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasters();
    fetchItems();
  }, [fetchMasters, fetchItems]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, setPage]);

  // Multi-word starts-with filtering for Grade Code or Job Title
  const filteredItems = items.filter((item) => {
    if (!debouncedSearch) return true;
    const gCode = item.grade?.code ?? item.grade?.name ?? '';
    const jTitle = item.jobTitle?.title ?? item.job_title?.title ?? item.jobTitle?.name ?? '';
    return (
      matchMultiWordStartsWith(gCode, debouncedSearch) ||
      matchMultiWordStartsWith(jTitle, debouncedSearch)
    );
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

  const handleSubmitForm = async (formData) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await gradeJobTitleApi.updateGradeJobTitle(editItem.id, formData);
        toast.success('Grade-Job Title mapping updated.');
      } else {
        await gradeJobTitleApi.createGradeJobTitle(formData);
        toast.success('Grade-Job Title mapping created.');
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await gradeJobTitleApi.deleteGradeJobTitle(deleteTarget.id);
      toast.success('Grade-Job Title mapping deleted.');
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grade-job-titles-page">
      <PageHeader
        title="Grade - Job Title Mappings"
        subtitle="Manage organizational grade levels and position designation associations."
        actions={
          <Button leftIcon={<RiAddLine />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
            Add Mapping
          </Button>
        }
      />

      <Card padding={false}>
        <div className="filter-row">
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by grade code or job title..."
            style={{ flex: 1, minWidth: 220 }}
          />
          <Button variant="ghost" leftIcon={<RiRefreshLine />} onClick={fetchItems} title="Refresh">
            Refresh
          </Button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mapping ID</th>
                <th>Grade Level</th>
                <th>Job Title / Position</th>
                <th>Relationship Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton cols={5} rows={6} />
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<RiSearchLine />}
                      title="No Grade-Job Title mappings found"
                      description="No records matching your search query."
                    />
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => {
                  const gCode = item.grade?.code ?? item.grade?.name ?? '—';
                  const jTitle = item.jobTitle?.title ?? item.job_title?.title ?? item.jobTitle?.name ?? '—';
                  const mapId = `GJT-${String(item.id).padStart(3, '0')}`;

                  return (
                    <tr
                      key={item.id}
                      className="table-row-hover"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDetail(item)}
                      title="Click to view Grade-Job Title mapping details"
                    >
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>
                          {mapId}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <RiBarChartLine style={{ color: 'var(--color-primary)' }} />
                          <span style={{ fontWeight: 600 }}>{gCode}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <RiBriefcaseLine style={{ color: 'var(--color-text-muted)' }} />
                          <span style={{ fontWeight: 500 }}>{jTitle}</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant="success" size="sm">Active Mapping</Badge>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<RiPencilLine />}
                            onClick={() => { setEditItem(item); setFormOpen(true); }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            leftIcon={<RiDeleteBinLine />}
                            onClick={() => setDeleteTarget(item)}
                          >
                            Delete
                          </Button>
                        </div>
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

      {/* Detail Popup Modal (No bottom close button) */}
      {selectedDetail && (
        <Modal
          isOpen={Boolean(selectedDetail)}
          onClose={() => setSelectedDetail(null)}
          title="Grade - Job Title Mapping Details"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DetailRow label="Mapping ID" value={`GJT-${String(selectedDetail.id).padStart(3, '0')}`} />
            <DetailRow label="Grade Level Code" value={selectedDetail.grade?.code ?? selectedDetail.grade?.name} />
            <DetailRow label="Grade Name" value={selectedDetail.grade?.name} />
            <DetailRow label="Job Title Designation" value={selectedDetail.jobTitle?.title ?? selectedDetail.job_title?.title} />
            <DetailRow label="Job Description" value={selectedDetail.jobTitle?.description ?? selectedDetail.job_title?.description} />
            <DetailRow label="Relationship Status" value="Active Mapping" />
          </div>
        </Modal>
      )}

      {/* Add / Edit Form Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit Grade-Job Title Mapping' : 'Add Grade-Job Title Mapping'}
        size="md"
      >
        <GradeJobTitleForm
          initial={editItem}
          grades={grades}
          jobTitles={jobTitles}
          onSubmit={handleSubmitForm}
          onCancel={() => { setFormOpen(false); setEditItem(null); }}
          loading={submitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Grade-Job Title Mapping"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting}>Delete</Button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Delete Grade-Job Title mapping <strong>GJT-{String(deleteTarget?.id).padStart(3, '0')}</strong> ({deleteTarget?.grade?.code} — {deleteTarget?.jobTitle?.title})? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
