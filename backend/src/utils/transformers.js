import dayjs from 'dayjs';

const formatDate = (val) => (val ? dayjs(val).format('YYYY-MM-DD') : null);
const formatDateTime = (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : null);

export const transformDepartment = (dept) => {
  if (!dept) return null;
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    created_at: formatDateTime(dept.created_at || dept.createdAt),
    updated_at: formatDateTime(dept.updated_at || dept.updatedAt),
  };
};

export const transformGrade = (grade) => {
  if (!grade) return null;
  return {
    id: grade.id,
    code: grade.code,
    description: grade.description,
    created_at: formatDateTime(grade.created_at || grade.createdAt),
    updated_at: formatDateTime(grade.updated_at || grade.updatedAt),
  };
};

export const transformJobTitle = (jt) => {
  if (!jt) return null;
  return {
    id: jt.id,
    title: jt.title,
    description: jt.description,
    created_at: formatDateTime(jt.created_at || jt.createdAt),
    updated_at: formatDateTime(jt.updated_at || jt.updatedAt),
  };
};

export const transformGradeJobTitle = (gjt) => {
  if (!gjt) return null;
  const gradeObj = gjt.grade
    ? { id: gjt.grade.id, code: gjt.grade.code }
    : null;
  const jtObj = gjt.jobTitle
    ? { id: gjt.jobTitle.id, title: gjt.jobTitle.title }
    : null;
  const label = gradeObj && jtObj ? `${gradeObj.code} — ${jtObj.title}` : '';

  return {
    id: gjt.id,
    grade_id: gjt.grade_id,
    job_title_id: gjt.job_title_id,
    grade: gradeObj,
    job_title: jtObj,
    label,
  };
};

export const transformHoliday = (holiday) => {
  if (!holiday) return null;
  return {
    id: holiday.id,
    holiday_name: holiday.holiday_name,
    holiday_date: formatDate(holiday.holiday_date),
    description: holiday.description,
    created_at: formatDateTime(holiday.created_at || holiday.createdAt),
    updated_at: formatDateTime(holiday.updated_at || holiday.updatedAt),
  };
};

export const transformLeaveType = (lt) => {
  if (!lt) return null;
  return {
    id: lt.id,
    name: lt.name,
    annual_quota: parseFloat(lt.annual_quota),
    negative_limit: parseFloat(lt.negative_limit),
    half_day_allowed: Boolean(lt.half_day_allowed),
    description: lt.description,
    created_at: formatDateTime(lt.created_at || lt.createdAt),
    updated_at: formatDateTime(lt.updated_at || lt.updatedAt),
  };
};

export const transformLeaveBalance = (lb) => {
  if (!lb) return null;
  return {
    id: lb.id,
    user_id: lb.user_id,
    year: lb.year,
    allocated: parseFloat(lb.allocated),
    used: parseFloat(lb.used),
    balance: parseFloat(lb.balance),
  };
};

export const transformAuthUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    employee_number: user.employee_number,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    status: user.status,
    employment_type: user.employment_type,
    force_password_change: Boolean(user.force_password_change),
    joining_date: formatDate(user.joining_date),
    role: user.role
      ? {
          id: user.role.id,
          name: user.role.name,
        }
      : undefined,
  };
};

export const transformUserDetail = (user) => {
  if (!user) return null;
  const gradeObj = user.gradeJobTitle?.grade
    ? { id: user.gradeJobTitle.grade.id, code: user.gradeJobTitle.grade.code }
    : user.grade
    ? { id: user.grade.id, code: user.grade.code }
    : null;

  const jobTitleObj = user.gradeJobTitle?.jobTitle
    ? { id: user.gradeJobTitle.jobTitle.id, title: user.gradeJobTitle.jobTitle.title }
    : user.jobTitle
    ? { id: user.jobTitle.id, title: user.jobTitle.title }
    : null;

  const managerObj = user.manager
    ? {
        id: user.manager.id,
        first_name: user.manager.first_name,
        last_name: user.manager.last_name,
        email: user.manager.email,
      }
    : null;

  return {
    id: user.id,
    employee_number: user.employee_number,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    personal_email: user.personal_email,
    phone: user.phone,
    gender: user.gender,
    dob: formatDate(user.dob),
    blood_group: user.blood_group,
    address: user.address,
    emergency_contact: user.emergency_contact,
    profile_photo: user.profile_photo,
    joining_date: formatDate(user.joining_date),
    relieving_date: formatDate(user.relieving_date),
    role_id: user.role_id,
    department_id: user.department_id,
    grade_job_title_id: user.grade_job_title_id,
    manager_id: user.manager_id,
    status: user.status,
    employment_type: user.employment_type,
    force_password_change: Boolean(user.force_password_change),
    role: user.role ? { id: user.role.id, name: user.role.name } : undefined,
    department: user.department
      ? { id: user.department.id, name: user.department.name }
      : undefined,
    grade: gradeObj,
    job_title: jobTitleObj,
    manager: managerObj,
    leave_balances: user.leaveBalances
      ? user.leaveBalances.map((lb) => ({
          leave_type_id: lb.leave_type_id,
          year: lb.year,
          allocated: parseFloat(lb.allocated),
          used: parseFloat(lb.used),
          balance: parseFloat(lb.balance),
        }))
      : undefined,
    created_at: formatDateTime(user.created_at || user.createdAt),
    updated_at: formatDateTime(user.updated_at || user.updatedAt),
  };
};

export const transformUserList = (user) => {
  if (!user) return null;
  const gradeObj = user.gradeJobTitle?.grade
    ? { id: user.gradeJobTitle.grade.id, code: user.gradeJobTitle.grade.code }
    : null;

  const jobTitleObj = user.gradeJobTitle?.jobTitle
    ? { id: user.gradeJobTitle.jobTitle.id, title: user.gradeJobTitle.jobTitle.title }
    : null;

  const managerObj = user.manager
    ? {
        id: user.manager.id,
        first_name: user.manager.first_name,
        last_name: user.manager.last_name,
      }
    : null;

  return {
    id: user.id,
    employee_number: user.employee_number,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    profile_photo: user.profile_photo,
    status: user.status,
    employment_type: user.employment_type,
    joining_date: formatDate(user.joining_date),
    role_id: user.role_id,
    department_id: user.department_id,
    grade_job_title_id: user.grade_job_title_id,
    manager_id: user.manager_id,
    role: user.role ? { id: user.role.id, name: user.role.name } : undefined,
    department: user.department
      ? { id: user.department.id, name: user.department.name }
      : undefined,
    grade: gradeObj,
    job_title: jobTitleObj,
    manager: managerObj,
    deleted_at: formatDateTime(user.deleted_at || user.deletedAt),
  };
};

export const transformLeaveRequestDetail = (lr) => {
  if (!lr) return null;
  return {
    id: lr.id,
    employee_id: lr.employee_id,
    leave_type_id: lr.leave_type_id,
    start_date: formatDate(lr.start_date),
    end_date: formatDate(lr.end_date),
    working_days: parseFloat(lr.working_days),
    is_half_day: Boolean(lr.is_half_day),
    half_day_type: lr.half_day_type,
    start_half_day: lr.start_half_day,
    end_half_day: lr.end_half_day,
    reason: lr.reason,
    status: lr.status,
    processed_at: formatDateTime(lr.processed_at),
    remarks: lr.remarks,
    cancelled_at: formatDateTime(lr.cancelled_at),
    cancellation_reason: lr.cancellation_reason,
    created_at: formatDateTime(lr.created_at || lr.createdAt),
    updated_at: formatDateTime(lr.updated_at || lr.updatedAt),
    employee: lr.employee
      ? {
          id: lr.employee.id,
          employee_number: lr.employee.employee_number,
          first_name: lr.employee.first_name,
          last_name: lr.employee.last_name,
          email: lr.employee.email,
          manager_id: lr.employee.manager_id,
          department: lr.employee.department
            ? {
                id: lr.employee.department.id,
                name: lr.employee.department.name,
              }
            : null,
        }
      : undefined,
    leave_type: lr.leaveType
      ? {
          id: lr.leaveType.id,
          name: lr.leaveType.name,
        }
      : undefined,
    processor: lr.processor
      ? {
          id: lr.processor.id,
          first_name: lr.processor.first_name,
          last_name: lr.processor.last_name,
        }
      : null,
    canceller: lr.canceller
      ? {
          id: lr.canceller.id,
          first_name: lr.canceller.first_name,
          last_name: lr.canceller.last_name,
        }
      : null,
  };
};

export const transformLeaveRequestList = (lr) => {
  if (!lr) return null;
  const statusVal = lr.status;
  const isPending = String(statusVal).toLowerCase() === 'pending';

  let processorName = null;
  if (lr.canceller) {
    processorName = `${lr.canceller.first_name || ''} ${lr.canceller.last_name || ''}`.trim();
  } else if (lr.processor) {
    processorName = `${lr.processor.first_name || ''} ${lr.processor.last_name || ''}`.trim();
  }

  const processedAt =
    formatDateTime(lr.processed_at) ||
    formatDateTime(lr.cancelled_at) ||
    (!isPending ? formatDateTime(lr.updated_at || lr.updatedAt) : null);

  return {
    id: lr.id,
    employee_id: lr.employee_id,
    leave_type_id: lr.leave_type_id,
    start_date: formatDate(lr.start_date),
    end_date: formatDate(lr.end_date),
    working_days: parseFloat(lr.working_days),
    is_half_day: Boolean(lr.is_half_day),
    half_day_type: lr.half_day_type,
    start_half_day: lr.start_half_day,
    end_half_day: lr.end_half_day,
    reason: lr.reason,
    cancellation_reason: lr.cancellation_reason,
    remarks: lr.remarks,
    status: statusVal,
    processed_by_name: processorName,
    processed_at: processedAt,
    created_at: formatDateTime(lr.created_at || lr.createdAt),
    employee: lr.employee
      ? {
          id: lr.employee.id,
          employee_number: lr.employee.employee_number,
          first_name: lr.employee.first_name,
          last_name: lr.employee.last_name,
          email: lr.employee.email,
          manager_id: lr.employee.manager_id,
          department: lr.employee.department
            ? {
                id: lr.employee.department.id,
                name: lr.employee.department.name,
              }
            : null,
        }
      : undefined,
    leave_type: lr.leaveType
      ? {
          id: lr.leaveType.id,
          name: lr.leaveType.name,
        }
      : undefined,
  };
};
