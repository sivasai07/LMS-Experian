/**
 * @file UserFormModal.jsx
 * @description HR Employee Account Creation & Profile Editing Modal Form.
 * Handles multi-section employee fields (personal details, organization role, grade/title mapping, manager assignment, password generation)
 * with real-time validation and dynamic grade-to-job-title dependencies.
 *
 * @module features/employee/components/UserFormModal
 */

import { useEffect, useState } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import Input from '../../../components/common/Input/Input';
import Select from '../../../components/common/Select/Select';
import Button from '../../../components/common/Button/Button';
import * as userApi from '../../../api/userApi';
import * as departmentApi from '../../../api/departmentApi';
import * as gradeJobTitleApi from '../../../api/gradeJobTitleApi';
import * as roleApi from '../../../api/roleApi';
import { extractApiError } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer Not to Say' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const EMPLOYMENT_OPTIONS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const EMPTY_FORM = {
  employee_number: '',
  first_name: '',
  last_name: '',
  email: '',
  personal_email: '',
  phone: '',
  password: '',
  role_id: '',
  department_id: '',
  grade_job_title_id: '',
  manager_id: '',
  joining_date: '',
  status: 'active',
  employment_type: 'full_time',
  gender: '',
  force_password_change: true,
};

/**
 * Normalize different possible API response shapes.
 * Our axios interceptor returns response.data directly,
 * so the response IS {success, message, data: [...]}.
 *
 * For ResourceCollection (like GradeJobTitle), Laravel wraps as:
 *   {success, data: {data: [...]}} — double-wrapped.
 * For plain arrays / UserResource:
 *   {success, data: [...]}
 */
function extractList(response) {
  // Double-wrapped: {success, data: {data: [...]}}  ← ResourceCollection
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }
  // Single-wrapped: {success, data: [...]}
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  // Direct array (fallback)
  if (Array.isArray(response)) {
    return response;
  }
  return [];
}

// Load each dropdown independently — failure in one won't block others
async function safeGet(fn) {
  try {
    const res = await fn();
    return extractList(res);
  } catch {
    return [];
  }
}

let cachedDropdowns = null;

export function invalidateUserFormDropdownCache() {
  cachedDropdowns = null;
}

export default function UserFormModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}) {
  const isEdit = !!user;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [gradeJobTitles, setGradeJobTitles] = useState([]);
  const [managers, setManagers] = useState([]);

  /**
   * Load dropdown data when the modal opens.
   * Caches response so editing/creating employees opens INSTANTLY.
   */
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadDropdowns() {
      if (!cachedDropdowns) {
        setDropdownsLoaded(false);
        const [
          rolesData,
          deptData,
          gjtData,
          usersData,
        ] = await Promise.all([
          safeGet(() => roleApi.getRoles()),
          safeGet(() => departmentApi.getDepartments({ per_page: 200 })),
          safeGet(() => gradeJobTitleApi.getGradeJobTitles()),
          safeGet(() => userApi.getUsers({ per_page: 200 })),
        ]);
        cachedDropdowns = { rolesData, deptData, gjtData, usersData };
      }

      if (cancelled) return;
      const { rolesData, deptData, gjtData, usersData } = cachedDropdowns;

      if (cancelled) return;

      setRoles(
        rolesData.map((r) => ({
          value: r.id,
          label: r.name,
        }))
      );

      setDepartments(
        deptData.map((d) => ({
          value: d.id,
          label: d.name,
        }))
      );

      setGradeJobTitles(
        gjtData.map((g) => {
          const gradeCode = g.grade?.code ?? g.grade?.name ?? '';
          const titleName = g.job_title?.title ?? g.jobTitle?.title ?? g.job_title?.name ?? '';
          const combinedLabel = [gradeCode, titleName].filter(Boolean).join(' — ');
          return {
            value: g.id,
            label: g.label ?? (combinedLabel || `Combo #${g.id}`),
            gradeCode: gradeCode.toLowerCase(),
            jobTitle: titleName.toLowerCase(),
            gradeId: g.grade?.id ?? g.grade_id,
            jobTitleId: g.job_title?.id ?? g.jobTitle?.id ?? g.job_title_id,
          };
        })
      );

      const mgrs = usersData
        .filter(
          (u) =>
            u.role?.name === 'Manager' ||
            u.role?.name === 'HR'
        )
        .map((u) => ({
          value: u.id,
          label:
            `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() ||
            u.email,
        }));

      setManagers(mgrs);

      setDropdownsLoaded(true);
    }

    loadDropdowns();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  /**
   * Pre-fill form when editing.
   * Reset form when creating a new employee.
   */
  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      const getVal = (value) => {
        if (value && typeof value === 'object') {
          return value.value ?? value.id ?? '';
        }
        return value ?? '';
      };

      const rawRole = user.role_id ?? user.role?.id ?? (roles.find((r) => String(r.label).toLowerCase() === String(user.role?.name ?? user.role ?? '').toLowerCase())?.value ?? '');
      const rawDept = user.department_id ?? user.department?.id ?? (departments.find((d) => String(d.label).toLowerCase() === String(user.department?.name ?? user.department ?? '').toLowerCase())?.value ?? '');
      let rawGjt = user.grade_job_title_id ?? user.grade_job_title?.id ?? user.gradeJobTitle?.id ?? '';
      const rawMgr = user.manager_id ?? user.manager?.id ?? '';

      // Robust fallback matching for Grade - Job Title combo if direct ID isn't set
      if (!rawGjt && gradeJobTitles.length > 0) {
        const userGradeCode = (user.grade?.code ?? user.grade?.name ?? (typeof user.grade === 'string' ? user.grade : '')).toLowerCase();
        const userGradeId = user.grade?.id ?? user.grade_id;
        const userJobTitleName = (user.job_title?.title ?? user.job_title?.name ?? (typeof user.job_title === 'string' ? user.job_title : '')).toLowerCase();
        const userJobTitleId = user.job_title?.id ?? user.job_title_id;

        const matchedGjt = gradeJobTitles.find((g) => {
          const matchGrade = (userGradeId && String(g.gradeId) === String(userGradeId)) || (userGradeCode && g.gradeCode === userGradeCode);
          const matchJob = (userJobTitleId && String(g.jobTitleId) === String(userJobTitleId)) || (userJobTitleName && g.jobTitle === userJobTitleName);
          return matchGrade && matchJob;
        }) || gradeJobTitles.find((g) => userGradeCode && g.gradeCode === userGradeCode);

        if (matchedGjt) {
          rawGjt = matchedGjt.value;
        }
      }

      setForm({
        employee_number: user.employee_number ?? '',
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        personal_email: user.personal_email ?? '',
        phone: user.phone ?? '',
        password: '',

        role_id: rawRole ? String(rawRole) : '',
        department_id: rawDept ? String(rawDept) : '',
        grade_job_title_id: rawGjt ? String(rawGjt) : '',
        manager_id: rawMgr ? String(rawMgr) : '',

        joining_date: user.joining_date ? String(user.joining_date).slice(0, 10) : '',
        status: getVal(user.status) || 'active',
        employment_type: getVal(user.employment_type) || 'full_time',
        gender: (() => {
          const rawG = getVal(user.gender);
          if (!rawG) return '';
          const match = GENDER_OPTIONS.find((g) => g.value.toLowerCase() === String(rawG).toLowerCase() || g.label.toLowerCase() === String(rawG).toLowerCase());
          return match ? match.value : String(rawG).toLowerCase();
        })(),
        force_password_change: false,
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }

    setErrors({});
  }, [user, isOpen, dropdownsLoaded, roles, departments, gradeJobTitles, managers]);

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) {
        payload[k] = null;
      } else {
        payload[k] = v;
      }
    });

    // Don't send an empty password when editing.
    if (isEdit && !payload.password) {
      delete payload.password;
    }

    try {
      if (isEdit) {
        const res = await userApi.updateUser(user.id, payload);
        const updatedUser = res.data ?? res;
        toast.success('Employee updated successfully.');
        cachedDropdowns = null;
        onSuccess?.(updatedUser);
      } else {
        const res = await userApi.createUser(payload);
        const createdUser = res.data ?? res;
        toast.success('Employee created. Welcome email sent.');
        cachedDropdowns = null;
        onSuccess?.(createdUser);
      }
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors);

        const firstMsg = Object.values(err.errors)
          .flat()
          .find(Boolean);

        toast.error(
          firstMsg ||
            'Please fix the validation errors.'
        );
      } else {
        toast.error(
          extractApiError(err)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const r2 = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit
          ? 'Edit Employee'
          : 'Add Employee'
      }
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            type="button"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="emp-form"
            loading={loading}
          >
            {isEdit
              ? 'Save Changes'
              : 'Create Employee'}
          </Button>
        </>
      }
    >
      <form
        id="emp-form"
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {!dropdownsLoaded && (
          <div
            style={{
              padding: '10px 14px',
              background:
                'var(--color-primary-light)',
              color:
                'var(--color-primary)',
              borderRadius:
                'var(--radius-sm)',
              fontSize:
                'var(--font-size-sm)',
              fontWeight: 500,
            }}
          >
            Loading dropdown data…
          </div>
        )}

        {/* Employment */}
        <div
          style={{
            borderBottom:
              '1px solid var(--color-border)',
            paddingBottom: 16,
          }}
        >
          <p
            style={{
              fontSize:
                'var(--font-size-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color:
                'var(--color-text-muted)',
              marginBottom: 14,
            }}
          >
            Employment Information
          </p>

          <div style={r2}>
            <Input
              name="employee_number"
              label="Employee Number"
              value={form.employee_number}
              onChange={handleChange}
              required={!isEdit}
              error={errors.employee_number}
            />

            <Input
              name="joining_date"
              label="Joining Date"
              type="date"
              value={form.joining_date}
              onChange={handleChange}
              required={!isEdit}
              error={errors.joining_date}
            />
          </div>

          <div
            style={{
              ...r2,
              marginTop: 16,
            }}
          >
            <Select
              name="role_id"
              label={
                roles.length > 0
                  ? `Role (${roles.length} options)`
                  : 'Role (loading…)'
              }
              value={form.role_id}
              onChange={handleChange}
              options={roles}
              placeholder="Select role"
              required={!isEdit}
              error={errors.role_id}
            />

            <Select
              name="department_id"
              label={
                departments.length > 0
                  ? `Department (${departments.length})`
                  : 'Department (loading…)'
              }
              value={form.department_id}
              onChange={handleChange}
              options={departments}
              placeholder="Select department"
              error={errors.department_id}
            />
          </div>

          <div
            style={{
              ...r2,
              marginTop: 16,
            }}
          >
            <Select
              name="manager_id"
              label={
                managers.length > 0
                  ? `Reporting Manager (${managers.length})`
                  : 'Reporting Manager'
              }
              value={form.manager_id}
              onChange={handleChange}
              options={managers}
              placeholder="Select Reporting Manager..."
              error={errors.manager_id}
            />

            <Select
              name="status"
              label="Status"
              value={form.status}
              onChange={handleChange}
              options={STATUS_OPTIONS}
              error={errors.status}
            />
          </div>

          <div
            style={{
              ...r2,
              marginTop: 16,
            }}
          >
            <Select
              name="employment_type"
              label="Employment Type"
              value={form.employment_type}
              onChange={handleChange}
              options={EMPLOYMENT_OPTIONS}
              error={errors.employment_type}
            />

            <Select
              name="grade_job_title_id"
              label={
                gradeJobTitles.length > 0
                  ? `Grade / Job Title (${gradeJobTitles.length})`
                  : 'Grade / Job Title (loading…)'
              }
              value={form.grade_job_title_id}
              onChange={handleChange}
              options={gradeJobTitles}
              placeholder="Select Grade & Job Title..."
              error={errors.grade_job_title_id}
            />
          </div>
        </div>

        {/* Personal */}
        <div
          style={{
            borderBottom:
              '1px solid var(--color-border)',
            paddingBottom: 16,
          }}
        >
          <p
            style={{
              fontSize:
                'var(--font-size-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color:
                'var(--color-text-muted)',
              marginBottom: 14,
            }}
          >
            Personal Information
          </p>

          <div style={r2}>
            <Input
              name="first_name"
              label="First Name"
              value={form.first_name}
              onChange={handleChange}
              required={!isEdit}
              error={errors.first_name}
            />

            <Input
              name="last_name"
              label="Last Name"
              value={form.last_name}
              onChange={handleChange}
              required={!isEdit}
              error={errors.last_name}
            />
          </div>

          <div
            style={{
              ...r2,
              marginTop: 16,
            }}
          >
            <Input
              name="email"
              label="Work Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required={!isEdit}
              error={errors.email}
            />

            <Input
              name="personal_email"
              label="Personal Email"
              type="email"
              value={form.personal_email}
              onChange={handleChange}
              error={errors.personal_email}
            />
          </div>

          <div
            style={{
              ...r2,
              marginTop: 16,
            }}
          >
            <Input
              name="phone"
              label="Phone"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
            />

            <Select
              name="gender"
              label="Gender"
              value={form.gender}
              onChange={handleChange}
              options={GENDER_OPTIONS}
              placeholder="Select gender"
              error={errors.gender}
            />
          </div>
        </div>

        {/* Account */}
        <div>
          <p
            style={{
              fontSize:
                'var(--font-size-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color:
                'var(--color-text-muted)',
              marginBottom: 14,
            }}
          >
            Account Settings
          </p>

          <div style={r2}>
            <Input
              name="password"
              label={
                isEdit
                  ? 'New Password (leave blank to keep)'
                  : 'Password'
              }
              type="password"
              value={form.password}
              onChange={handleChange}
              required={!isEdit}
              error={errors.password}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingTop: 24,
              }}
            >
              <input
                type="checkbox"
                id="force-pwd"
                name="force_password_change"
                checked={
                  !!form.force_password_change
                }
                onChange={handleChange}
                style={{
                  width: 16,
                  height: 16,
                  cursor: 'pointer',
                }}
              />

              <label
                htmlFor="force-pwd"
                style={{
                  fontSize:
                    'var(--font-size-sm)',
                  cursor: 'pointer',
                  color:
                    'var(--color-text-primary)',
                }}
              >
                Require password change on first
                login
              </label>
            </div>
          </div>

          {!isEdit && (
            <p
              style={{
                fontSize:
                  'var(--font-size-xs)',
                color:
                  'var(--color-text-muted)',
                marginTop: 10,
              }}
            >
              A welcome email with login
              credentials will be sent to the
              employee.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}