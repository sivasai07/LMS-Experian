/**
 * @file HolidaysPage.jsx
 * @description Company Public Holiday Calendar Master Data Management Page.
 * Enables HR administrators to create, edit, search (multi-word starts-with filtering), and delete company public holidays,
 * featuring custom page size pagination and detail popups.
 *
 * @module features/holiday/pages/HolidaysPage
 */

import { useCallback, useEffect, useState } from 'react';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiCalendar2Line, RiSearchLine, RiRefreshLine } from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import Search from '../../../components/common/Search/Search';
import Pagination from '../../../components/common/Pagination/Pagination';
import { TableRowSkeleton } from '../../../components/common/Skeleton/Skeleton';
import * as holidayApi from '../../../api/holidayApi';
import { formatDate } from '../../../utils/date';
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

/* Backend fields: holiday_name, holiday_date, description */
function HolidayForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    holiday_name: initial?.holiday_name ?? '',
    holiday_date: initial?.holiday_date ?? '',
    description: initial?.description ?? '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.holiday_name.trim()) errs.holiday_name = 'Holiday name is required.';
    if (!form.holiday_date) errs.holiday_date = 'Date is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        name="holiday_name"
        label="Holiday Name"
        value={form.holiday_name}
        onChange={handleChange}
        required
        error={errors.holiday_name}
        leftIcon={<RiCalendar2Line />}
        placeholder="e.g. Independence Day"
      />
      <Input
        name="holiday_date"
        label="Date"
        type="date"
        value={form.holiday_date}
        onChange={handleChange}
        required
        error={errors.holiday_date}
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
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Save Changes' : 'Add Holiday'}
        </Button>
      </div>
    </form>
  );
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
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

  const fetchHolidays = useCallback(() => {
    setLoading(true);
    holidayApi
      .getHolidays()
      .then((res) => setHolidays(extractArray(res) ?? []))
      .catch(() => setHolidays([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, setPage]);

  // Multi-word starts-with filtering on holiday name
  const filteredHolidays = holidays.filter((h) => {
    if (!debouncedSearch) return true;
    return matchMultiWordStartsWith(h.holiday_name ?? h.name, debouncedSearch);
  });

  // Client-side pagination calculations
  const total = filteredHolidays.length;
  const currentPerPage = perPage === 1000 ? (total > 0 ? total : 1000) : perPage;
  const last_page = Math.ceil(total / currentPerPage) || 1;
  const pagedHolidays = perPage === 1000
    ? filteredHolidays
    : filteredHolidays.slice((page - 1) * currentPerPage, page * currentPerPage);

  const meta = {
    current_page: page,
    from: total > 0 ? (page - 1) * currentPerPage + 1 : 0,
    to: Math.min(page * currentPerPage, total),
    per_page: currentPerPage,
    total,
    last_page,
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await holidayApi.updateHoliday(editItem.id, formData);
        toast.success('Holiday updated.');
      } else {
        await holidayApi.createHoliday(formData);
        toast.success('Holiday added.');
      }
      setFormOpen(false);
      setEditItem(null);
      fetchHolidays();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await holidayApi.deleteHoliday(deleteTarget.id);
      toast.success('Holiday deleted.');
      setDeleteTarget(null);
      fetchHolidays();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Holidays"
        subtitle="Manage public holidays — these are automatically excluded from working day leave calculations"
        actions={
          <Button leftIcon={<RiAddLine />} onClick={() => { setEditItem(null); setFormOpen(true); }}>
            Add Holiday
          </Button>
        }
      />

      <Card padding={false}>
        <div className="filter-row">
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by holiday name..."
            style={{ flex: 1, minWidth: 220 }}
          />
          <Button variant="ghost" leftIcon={<RiRefreshLine />} onClick={fetchHolidays} title="Refresh">
            Refresh
          </Button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Holiday Name</th>
                <th>Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton cols={5} rows={8} />
              ) : pagedHolidays.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<RiSearchLine />}
                      title="No holidays found"
                      description="No holidays matching your search query."
                    />
                  </td>
                </tr>
              ) : (
                pagedHolidays.map((h, idx) => (
                  <tr
                    key={h.id ?? idx}
                    className="table-row-hover"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDetail(h)}
                    title="Click to view holiday details"
                  >
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                      {(page - 1) * currentPerPage + idx + 1}
                    </td>
                    <td style={{ fontWeight: 500 }}>{h.holiday_name ?? h.name}</td>
                    <td>{formatDate(h.holiday_date)}</td>
                    <td className="cell-truncate">{h.description ?? '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<RiPencilLine />}
                          onClick={() => { setEditItem(h); setFormOpen(true); }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<RiDeleteBinLine />}
                          onClick={() => setDeleteTarget(h)}
                        >
                          Delete
                        </Button>
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

      {/* Holiday Details Popup Modal (No bottom close button) */}
      {selectedDetail && (
        <Modal
          isOpen={Boolean(selectedDetail)}
          onClose={() => setSelectedDetail(null)}
          title="Company Public Holiday Details"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DetailRow label="Holiday Name" value={selectedDetail.holiday_name ?? selectedDetail.name} />
            <DetailRow label="Holiday Date" value={formatDate(selectedDetail.holiday_date)} />
            <DetailRow label="Description" value={selectedDetail.description} />
            <DetailRow label="System Status" value="Excluded from Working Day Calculations" />
          </div>
        </Modal>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit Holiday' : 'Add Holiday'}
        size="md"
      >
        <HolidayForm
          initial={editItem}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditItem(null); }}
          loading={submitting}
        />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Holiday"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Delete <strong>{deleteTarget?.holiday_name ?? deleteTarget?.name}</strong>? This will re-include this date in future leave calculations.
        </p>
      </Modal>
    </div>
  );
}
