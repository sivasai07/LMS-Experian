/**
 * @file ApplyLeaveForm.jsx
 * @description Interactive Leave Application Form Component.
 * Features an Enterprise HR Leave Calculation Engine for multi-day and single-day custom half-days,
 * weekend & public holiday exclusions, 5-day max consecutive leave limit enforcement, and dynamic summary banner.
 */

import { useEffect, useState, useMemo } from 'react';
import Input from '../../../components/common/Input/Input';
import Select from '../../../components/common/Select/Select';
import Button from '../../../components/common/Button/Button';
import { validateLeaveForm } from '../../../utils/validators';
import * as leaveApi from '../../../api/leaveApi';
import * as holidayApi from '../../../api/holidayApi';
import { extractApiError, extractArray, formatDays } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const START_HALF_OPTIONS = [
  { value: 'first_half', label: 'First Half (Starts Morning)' },
  { value: 'second_half', label: 'Second Half (Starts Afternoon)' },
  { value: 'full_day', label: 'Full Day' },
];

const END_HALF_OPTIONS = [
  { value: 'first_half', label: 'First Half (Ends at Lunch)' },
  { value: 'second_half', label: 'Second Half (Ends Evening)' },
  { value: 'full_day', label: 'Full Day' },
];

/**
 * Enterprise HR Leave Calculation Engine.
 * Calculates exact working days by evaluating start date portion, end date portion,
 * middle working days, and excluding weekends and public holidays.
 */
function calculateWorkingDays(startDateStr, endDateStr, startHalfType, endHalfType, isHalfDayCheck, holidays = []) {
  if (!startDateStr || !endDateStr) {
    return { days: 0, weekendDays: 0, holidayDays: 0, totalCalendarDays: 0, isCalculated: false };
  }

  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const [eY, eM, eD] = endDateStr.split('-').map(Number);

  const start = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return { days: 0, weekendDays: 0, holidayDays: 0, totalCalendarDays: 0, isCalculated: false };
  }

  const holidaySet = new Set(
    holidays.map((h) => (typeof h === 'string' ? h : h.holiday_date))
  );

  let weekendDays = 0;
  let holidayDays = 0;
  let totalCalendarDays = 0;

  const datesList = [];
  const cur = new Date(start);

  while (cur <= end) {
    totalCalendarDays++;
    const dayOfWeek = cur.getDay(); // 0 = Sun, 6 = Sat
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dateISO = `${y}-${m}-${d}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateISO);
    const isWorkDay = !isWeekend && !isHoliday;

    if (isWeekend) weekendDays++;
    else if (isHoliday) holidayDays++;

    datesList.push({ dateISO, isWorkDay });
    cur.setDate(cur.getDate() + 1);
  }

  let workingDays = 0;

  if (datesList.length === 1) {
    // Single Day Leave Request
    const single = datesList[0];
    if (single.isWorkDay) {
      const isHalf = (startHalfType && startHalfType !== 'full_day') ||
                     (endHalfType && endHalfType !== 'full_day') ||
                     isHalfDayCheck;
      workingDays = isHalf ? 0.5 : 1.0;
    } else {
      workingDays = 0;
    }
  } else {
    // Multi-Day Leave Request
    datesList.forEach((item, idx) => {
      if (!item.isWorkDay) return;

      let dayVal = 1.0;
      const isFirst = idx === 0;
      const isLast = idx === datesList.length - 1;

      if (isFirst) {
        // Start date: Second Half means leave starts in afternoon (0.5 day leave)
        if (startHalfType === 'second_half') {
          dayVal = 0.5;
        } else {
          dayVal = 1.0; // First Half or Full Day = 1.0 day leave
        }
      } else if (isLast) {
        // End date: First Half means leave ends at lunch (0.5 day leave)
        if (endHalfType === 'first_half') {
          dayVal = 0.5;
        } else {
          dayVal = 1.0; // Second Half or Full Day = 1.0 day leave
        }
      }

      workingDays += dayVal;
    });
  }

  return { days: workingDays, weekendDays, holidayDays, totalCalendarDays, isCalculated: true };
}

export default function ApplyLeaveForm({ onSuccess, onCancel }) {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [dayMode, setDayMode] = useState('full'); // 'full' or 'custom'
  const [form, setForm] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    start_half: 'first_half',
    end_half: 'second_half',
    is_half_day: false,
    reason: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    leaveApi.getLeaveTypes().then((res) => {
      setLeaveTypes((extractArray(res) ?? []).map((lt) => ({ value: lt.id, label: lt.name })));
    }).catch(() => {});

    holidayApi.getHolidays({}).then((res) => {
      setHolidays(extractArray(res) ?? []);
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => {
      const val = type === 'checkbox' ? checked : value;
      const updated = { ...f, [name]: val };
      if (name === 'start_date' && (!updated.end_date || updated.end_date < value)) {
        updated.end_date = value;
      }
      return updated;
    });
    setErrors((err) => ({ ...err, [name]: null }));
  };

  const calculation = useMemo(() => {
    return calculateWorkingDays(
      form.start_date,
      form.end_date || form.start_date,
      dayMode === 'custom' ? form.start_half : 'full_day',
      dayMode === 'custom' ? form.end_half : 'full_day',
      form.is_half_day,
      holidays
    );
  }, [form.start_date, form.end_date, form.start_half, form.end_half, form.is_half_day, dayMode, holidays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveEndDate = form.end_date || form.start_date;
    const formToValidate = { ...form, end_date: effectiveEndDate };
    const errs = validateLeaveForm(formToValidate);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // 1. Guard against 0 working days
    if (calculation.isCalculated && calculation.days === 0) {
      if (calculation.holidayDays > 0) {
        toast.error('The selected date range falls on a public holiday. Please select valid working days.');
      } else if (calculation.weekendDays > 0) {
        toast.error('The selected date range falls on a weekend. Please select valid working days.');
      } else {
        toast.error('Selected date range contains 0 working days.');
      }
      return;
    }

    // 2. Guard against maximum consecutive > 5 days leave
    if (calculation.isCalculated && calculation.days > 5) {
      toast.error('Maximum consecutive leave limit exceeded! You cannot apply for more than 5 consecutive working days.');
      return;
    }

    const isHalf = form.is_half_day || (dayMode === 'custom' && (form.start_half !== 'full_day' || form.end_half !== 'full_day'));
    let halfDayType = 'first_half';
    if (form.start_half && form.start_half !== 'full_day') {
      halfDayType = form.start_half;
    } else if (form.end_half && form.end_half !== 'full_day') {
      halfDayType = form.end_half;
    }

    const payload = {
      leave_type_id: Number(form.leave_type_id),
      start_date: form.start_date,
      end_date: effectiveEndDate,
      reason: form.reason,
      is_half_day: isHalf,
      ...(isHalf && { half_day_type: halfDayType }),
      start_half_day: form.start_half || 'first_half',
      end_half_day: form.end_half || 'second_half',
      working_days: calculation.days > 0 ? calculation.days : (isHalf ? 0.5 : 1.0),
    };

    setLoading(true);
    try {
      await leaveApi.applyLeave(payload);
      toast.success('Leave application submitted successfully.');
      onSuccess?.();
    } catch (err) {
      const apiErrMsg = extractApiError(err);
      if (apiErrMsg.toLowerCase().includes('maximum consecutive') || err?.code === 'MAX_LEAVE_EXCEEDED') {
        toast.error('Maximum consecutive leave limit exceeded! You cannot apply for more than 5 consecutive working days.');
      } else if (apiErrMsg.toLowerCase().includes('no working days') || err?.code === 'NO_WORKING_DAYS') {
        toast.error('Selected date range contains only weekends or public holidays.');
      } else if (apiErrMsg.toLowerCase().includes('overlap') || err?.code === 'OVERLAPPING_LEAVE') {
        toast.error('You already have a leave request during this date range.');
      } else if (err?.errors) {
        setErrors(err.errors);
        const first = Object.values(err.errors).flat()[0];
        toast.error(first || 'Please fix the errors below.');
      } else {
        toast.error(apiErrMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Leave Type */}
      <Select
        name="leave_type_id"
        label="Leave Type"
        value={form.leave_type_id}
        onChange={handleChange}
        options={leaveTypes}
        placeholder="Select leave type"
        required
        error={errors.leave_type_id}
      />

      {/* Day Mode Toggle Bar: Full Day | Custom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={() => {
            setDayMode('full');
            setForm((f) => ({ ...f, start_half: 'full_day', end_half: 'full_day', is_half_day: false }));
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: dayMode === 'full' ? '#0f4c81' : 'var(--color-surface)',
            color: dayMode === 'full' ? '#ffffff' : 'var(--color-text-primary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13.5px',
            transition: 'all 0.2s ease',
          }}
        >
          📅 Full Day
        </button>

        <button
          type="button"
          onClick={() => setDayMode('custom')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: dayMode === 'custom' ? '#0f4c81' : 'var(--color-surface)',
            color: dayMode === 'custom' ? '#ffffff' : 'var(--color-text-primary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13.5px',
            transition: 'all 0.2s ease',
          }}
        >
          ⚙️ Custom / Half Day
        </button>
      </div>

      {/* Date & Half Day Inputs */}
      {dayMode === 'full' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            name="start_date"
            label="From Date"
            type="date"
            value={form.start_date}
            onChange={handleChange}
            required
            error={errors.start_date}
          />
          <Input
            name="end_date"
            label="To Date"
            type="date"
            value={form.end_date}
            onChange={handleChange}
            required
            error={errors.end_date}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Start Date + Start Half Option */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              name="start_date"
              label="From Date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              required
              error={errors.start_date}
            />
            <Select
              name="start_half"
              label="From Day Portion"
              value={form.start_half}
              onChange={handleChange}
              options={START_HALF_OPTIONS}
            />
          </div>

          {/* End Date + End Half Option */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              name="end_date"
              label="To Date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
              required
              error={errors.end_date}
            />
            <Select
              name="end_half"
              label="To Day Portion"
              value={form.end_half}
              onChange={handleChange}
              options={END_HALF_OPTIONS}
            />
          </div>
        </div>
      )}

      {/* Working Days Summary Banner */}
      {calculation.isCalculated && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '15px',
          fontWeight: 700,
          textAlign: 'center',
          background: (calculation.days > 5 || calculation.days === 0) ? '#fef2f2' : '#e0f2fe',
          border: `1px solid ${(calculation.days > 5 || calculation.days === 0) ? '#fca5a5' : '#bae6fd'}`,
          color: (calculation.days > 5 || calculation.days === 0) ? '#991b1b' : '#0369a1',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {calculation.days > 5 ? (
            <span>❌ Maximum consecutive leave limit exceeded (<strong>{formatDays(calculation.days)} Working Days</strong>). Maximum allowed is <strong>5 days</strong>.</span>
          ) : calculation.days > 0 ? (
            <span>You are applying Leave for <strong>{formatDays(calculation.days)} Working Days</strong></span>
          ) : calculation.holidayDays > 0 ? (
            <span>❌ Selected date range falls on a public holiday (0 working days). Cannot submit leave application.</span>
          ) : (
            <span>❌ Selected date range falls on a weekend (0 working days). Cannot submit leave application.</span>
          )}
        </div>
      )}

      {/* Reason Field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
          Reason <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <textarea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          rows={3}
          placeholder="Please provide a reason for your leave..."
          style={{
            padding: '10px 12px',
            border: `1px solid ${errors.reason ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontFamily: 'inherit',
            fontSize: 'var(--font-size-base)',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        {errors.reason && <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>{errors.reason}</span>}
      </div>

      {/* Form Buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={calculation.isCalculated && (calculation.days === 0 || calculation.days > 5)}
        >
          Submit Application
        </Button>
      </div>
    </form>
  );
}
