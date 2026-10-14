/**
 * @file ProfilePage.jsx
 * @description User Profile Management & Self-Service Account Portal.
 * Allows authenticated employees to view read-only organizational details (department, designation, manager),
 * update personal contact info, upload profile photos, and edit personal demographics with validation feedback.
 */

import { useEffect, useState } from 'react';
import {
  RiUserLine, RiMailLine, RiPhoneLine, RiSaveLine,
  RiCalendarLine, RiBriefcaseLine, RiShieldUserLine,
  RiBuildingLine, RiHomeSmileLine,
  RiAlertLine, RiLockPasswordLine, RiCameraLine,
} from 'react-icons/ri';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import Card from '../../../components/common/Card/Card';
import Input from '../../../components/common/Input/Input';
import Select from '../../../components/common/Select/Select';
import Avatar from '../../../components/common/Avatar/Avatar';
import Button from '../../../components/common/Button/Button';
import Badge from '../../../components/common/Badge/Badge';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate } from '../../../utils/date';
import * as userApi from '../../../api/userApi';
import api from '../../../api/axios';
import { API } from '../../../constants/apiEndpoints';
import { extractApiError } from '../../../utils/helpers';
import { getFullName } from '../../../utils/userHelpers';
import { ROUTES } from '../../../constants/routes';
import { Link } from 'react-router-dom';
import './ProfilePage.css';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer Not to Say' },
];

const BLOOD_GROUP_OPTIONS = [
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
];

function InfoRow({ label, value }) {
  return (
    <div className="profile-meta-item">
      <span className="profile-meta-label">{label}</span>
      <span className="profile-meta-value">{value ?? '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    personal_email: '',
    gender: '',
    dob: '',
    blood_group: '',
    address: '',
    emergency_contact: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [fullProfile, setFullProfile] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load full profile from /users/profile to get all relations
  useEffect(() => {
    let isMounted = true;
    userApi.getProfile()
      .then((res) => {
        if (!isMounted) return;
        const p = res.data ?? res;
        const displayName = getFullName(p);
        const withName = {
          ...p,
          name: displayName !== '—' ? displayName : p.email,
        };
        setFullProfile(withName);
        updateUser(withName);
        setForm({
          first_name: p.first_name ?? '',
          last_name: p.last_name ?? '',
          phone: p.phone ?? '',
          personal_email: p.personal_email ?? '',
          gender: String(p.gender?.value ?? p.gender ?? '').toLowerCase(),
          dob: p.dob ?? '',
          blood_group: p.blood_group ?? '',
          address: p.address ?? '',
          emergency_contact: p.emergency_contact ?? '',
        });
      })
      .catch((err) => {
        if (isMounted) setErrorMsg(extractApiError(err));
      })
      .finally(() => {
        if (isMounted) setProfileLoading(false);
      });

    return () => { isMounted = false; };
  }, [updateUser]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: null }));
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    setErrors({});

    // Convert empty strings to null so Laravel nullable validation rules pass
    const cleanPayload = {};
    Object.entries(form).forEach(([key, val]) => {
      if (val === '' || val === null || val === undefined) {
        cleanPayload[key] = null;
      } else {
        cleanPayload[key] = typeof val === 'string' ? val.trim() : val;
      }
    });

    try {
      let res;
      if (photoFile) {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        Object.entries(cleanPayload).forEach(([key, val]) => {
          if (val !== null && val !== undefined) {
            formData.append(key, val);
          }
        });
        formData.append('profile_photo', photoFile);
        res = await api.post(API.USERS.PROFILE, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await userApi.updateProfile(cleanPayload);
      }

      const updated = res.data ?? res;
      const displayName = getFullName(updated);
      const withName = {
        ...updated,
        name: displayName !== '—' ? displayName : updated.email,
      };

      updateUser(withName);
      setFullProfile(withName);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccessMsg('✓ Profile updated successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors);
        const errorDetails = Object.values(err.errors).flat().filter(Boolean).join(' • ');
        setErrorMsg(errorDetails || extractApiError(err));
      } else {
        setErrorMsg(extractApiError(err));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const profile = fullProfile ?? user;
  if (!profile && !profileLoading) return null;

  const statusVal = typeof profile?.status === 'object' ? profile.status?.value : profile?.status;
  const storageBase = import.meta.env.VITE_STORAGE_URL ?? 'http://localhost:8000/storage';
  const photoUrl = photoPreview ?? (profile?.profile_photo ? `${storageBase}/${profile.profile_photo}` : null);
  const profileDisplayName = getFullName(profile);

  return (
    <div>
      <PageHeader title="My Profile" subtitle="View and update your personal information" />

      {/* TOP GREEN SUCCESS MESSAGE BANNER */}
      {successMsg && (
        <div className="profile-alert profile-alert-success" role="alert">
          <span className="profile-alert-icon">✓</span>
          <span className="profile-alert-text">{successMsg}</span>
          <button type="button" className="profile-alert-close" onClick={() => setSuccessMsg(null)} aria-label="Close">
            ×
          </button>
        </div>
      )}

      {/* TOP RED ERROR MESSAGE BANNER */}
      {errorMsg && (
        <div className="profile-alert profile-alert-danger" role="alert">
          <span className="profile-alert-icon">⚠</span>
          <span className="profile-alert-text">{errorMsg}</span>
          <button type="button" className="profile-alert-close" onClick={() => setErrorMsg(null)} aria-label="Close">
            ×
          </button>
        </div>
      )}

      {profileLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading profile…</div>
      ) : profile && (
        <div className="profile-grid">

          {/* ── LEFT: Identity Card ────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card>
              <div className="profile-card">
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar name={profileDisplayName} src={photoUrl} size="xl" />
                  <label
                    htmlFor="profile_photo_input"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: 'var(--color-primary)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                    title="Upload Profile Picture"
                  >
                    <RiCameraLine style={{ fontSize: 16 }} />
                  </label>
                  <input
                    id="profile_photo_input"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handlePhotoChange}
                  />
                </div>

                <h2 className="profile-name">{profileDisplayName}</h2>
                <p className="profile-email">{profile.email}</p>

                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {profile.role?.name && <Badge variant="primary">{profile.role.name}</Badge>}
                  {profile.department?.name && <Badge variant="default">{profile.department.name}</Badge>}
                  {statusVal && (
                    <Badge variant={statusVal === 'active' || statusVal === 'Active' ? 'success' : 'default'} size="sm">
                      {statusVal}
                    </Badge>
                  )}
                </div>

                <div className="profile-meta">
                  <InfoRow label="Employee No." value={profile.employee_number} />
                  <InfoRow label="Job Title" value={profile.job_title?.title ?? profile.gradeJobTitle?.jobTitle?.title} />
                  <InfoRow label="Grade" value={profile.grade?.code ?? profile.gradeJobTitle?.grade?.code} />
                  <InfoRow label="Department" value={profile.department?.name} />
                  <InfoRow label="Manager" value={
                    profile.manager
                      ? getFullName(profile.manager)
                      : null
                  } />
                  <InfoRow label="Date Joined" value={formatDate(profile.joining_date)} />
                  <InfoRow label="Employment Type" value={
                    typeof profile.employment_type === 'object'
                      ? profile.employment_type?.value
                      : profile.employment_type
                  } />
                </div>
              </div>
            </Card>

            {/* Change password quick-link */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <RiLockPasswordLine style={{ fontSize: 20, color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Password</span>
                </div>
                <Link to={ROUTES.CHANGE_PASSWORD}>
                  <Button size="sm" variant="secondary">Change</Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* ── RIGHT: Edit Form ───────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Personal Information Form */}
            <Card title="Personal Information">
              <form id="profile-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div className="profile-form-section">
                  <p className="profile-form-section-title"><RiUserLine /> Full Name</p>
                  <div className="profile-form-row">
                    <Input
                      name="first_name"
                      label="First Name"
                      value={form.first_name}
                      onChange={handleChange}
                      leftIcon={<RiUserLine />}
                      error={errors.first_name}
                      placeholder="First Name"
                    />
                    <Input
                      name="last_name"
                      label="Last Name"
                      value={form.last_name}
                      onChange={handleChange}
                      leftIcon={<RiUserLine />}
                      error={errors.last_name}
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div className="profile-form-section">
                  <p className="profile-form-section-title"><RiPhoneLine /> Contact</p>
                  <div className="profile-form-row">
                    <Input
                      name="phone"
                      label="Phone Number"
                      value={form.phone}
                      onChange={handleChange}
                      leftIcon={<RiPhoneLine />}
                      error={errors.phone}
                      placeholder="+91 99999 99999"
                    />
                    <Input
                      name="personal_email"
                      label="Personal Email"
                      type="email"
                      value={form.personal_email}
                      onChange={handleChange}
                      leftIcon={<RiMailLine />}
                      error={errors.personal_email}
                      placeholder="personal@gmail.com"
                    />
                  </div>
                </div>

                <div className="profile-form-section">
                  <p className="profile-form-section-title"><RiUserLine /> Personal Details</p>
                  <div className="profile-form-row">
                    <Select
                      name="gender"
                      label="Gender"
                      value={form.gender}
                      onChange={handleChange}
                      options={GENDER_OPTIONS}
                      placeholder="Select gender"
                      error={errors.gender}
                    />
                    <Input
                      name="dob"
                      label="Date of Birth"
                      type="date"
                      value={form.dob}
                      onChange={handleChange}
                      leftIcon={<RiCalendarLine />}
                      error={errors.dob}
                    />
                  </div>
                  <div className="profile-form-row" style={{ marginTop: 16 }}>
                    <Select
                      name="blood_group"
                      label="Blood Group"
                      value={form.blood_group}
                      onChange={handleChange}
                      options={BLOOD_GROUP_OPTIONS}
                      placeholder="Select blood group"
                      error={errors.blood_group}
                    />
                    <Input
                      name="emergency_contact"
                      label="Emergency Contact"
                      value={form.emergency_contact}
                      onChange={handleChange}
                      leftIcon={<RiAlertLine />}
                      error={errors.emergency_contact}
                      placeholder="+91 99999 99999"
                    />
                  </div>
                </div>

                <div className="profile-form-section">
                  <p className="profile-form-section-title"><RiHomeSmileLine /> Address</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter your full address…"
                      style={{
                        padding: '10px 12px',
                        border: `1px solid ${errors.address ? 'var(--color-danger)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'inherit',
                        fontSize: 'var(--font-size-base)',
                        resize: 'vertical',
                        outline: 'none',
                      }}
                    />
                    {errors.address && <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>{errors.address}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" loading={loading} leftIcon={<RiSaveLine />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>

            {/* Read-only: Employment Info */}
            <Card title="Employment Information">
              <div className="profile-meta">
                <InfoRow label={<><RiBriefcaseLine style={{ marginRight: 4 }} />Job Title</>}
                  value={profile.job_title?.title ?? profile.gradeJobTitle?.jobTitle?.title} />
                <InfoRow label={<><RiBuildingLine style={{ marginRight: 4 }} />Department</>}
                  value={profile.department?.name} />
                <InfoRow label={<><RiShieldUserLine style={{ marginRight: 4 }} />Role</>}
                  value={profile.role?.name} />
                <InfoRow label={<><RiCalendarLine style={{ marginRight: 4 }} />Joining Date</>}
                  value={formatDate(profile.joining_date)} />
                <InfoRow label="Manager"
                  value={profile.manager
                    ? getFullName(profile.manager)
                    : null} />
                <InfoRow label="Employee No." value={profile.employee_number} />
                <InfoRow label="Status" value={
                  <Badge variant={statusVal === 'active' || statusVal === 'Active' ? 'success' : 'default'} size="sm">
                    {statusVal}
                  </Badge>
                } />
              </div>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
