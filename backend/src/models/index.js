import sequelize from '../config/database.js';
import Role from './Role.js';
import Department from './Department.js';
import Grade from './Grade.js';
import JobTitle from './JobTitle.js';
import GradeJobTitle from './GradeJobTitle.js';
import Holiday from './Holiday.js';
import LeaveType from './LeaveType.js';
import User from './User.js';
import LeaveBalance from './LeaveBalance.js';
import LeaveRequest from './LeaveRequest.js';
import BlacklistedToken from './BlacklistedToken.js';

// User <-> Role
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// User <-> Department
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(User, { foreignKey: 'department_id', as: 'users' });

// GradeJobTitle <-> Grade & JobTitle
GradeJobTitle.belongsTo(Grade, { foreignKey: 'grade_id', as: 'grade' });
Grade.hasMany(GradeJobTitle, { foreignKey: 'grade_id', as: 'gradeJobTitles' });

GradeJobTitle.belongsTo(JobTitle, { foreignKey: 'job_title_id', as: 'jobTitle' });
JobTitle.hasMany(GradeJobTitle, { foreignKey: 'job_title_id', as: 'gradeJobTitles' });

// User <-> GradeJobTitle
User.belongsTo(GradeJobTitle, { foreignKey: 'grade_job_title_id', as: 'gradeJobTitle' });
GradeJobTitle.hasMany(User, { foreignKey: 'grade_job_title_id', as: 'users' });

// User <-> Manager (Self-referencing)
User.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
User.hasMany(User, { foreignKey: 'manager_id', as: 'directReports' });

// User <-> LeaveBalance
LeaveBalance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(LeaveBalance, { foreignKey: 'user_id', as: 'leaveBalances' });

// LeaveRequest <-> User (Employee)
LeaveRequest.belongsTo(User, { foreignKey: 'employee_id', as: 'employee' });
User.hasMany(LeaveRequest, { foreignKey: 'employee_id', as: 'leaveRequests' });

// LeaveRequest <-> LeaveType
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leave_type_id', as: 'leaveType' });
LeaveType.hasMany(LeaveRequest, { foreignKey: 'leave_type_id', as: 'leaveRequests' });

// LeaveRequest <-> Processor & Canceller
LeaveRequest.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' });
LeaveRequest.belongsTo(User, { foreignKey: 'cancelled_by', as: 'canceller' });

export {
  sequelize,
  Role,
  Department,
  Grade,
  JobTitle,
  GradeJobTitle,
  Holiday,
  LeaveType,
  User,
  LeaveBalance,
  LeaveRequest,
  BlacklistedToken,
};

export default {
  sequelize,
  Role,
  Department,
  Grade,
  JobTitle,
  GradeJobTitle,
  Holiday,
  LeaveType,
  User,
  LeaveBalance,
  LeaveRequest,
  BlacklistedToken,
};
