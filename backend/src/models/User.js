import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  personal_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  blood_group: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  emergency_contact: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  profile_photo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  joining_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  relieving_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
  },
  employment_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'full_time',
  },
  force_password_change: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  role_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id',
    },
  },
  department_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'departments',
      key: 'id',
    },
  },
  grade_job_title_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'grade_job_titles',
      key: 'id',
    },
  },
  manager_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  remember_token: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'users',
  paranoid: true, // handles deleted_at soft delete
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['manager_id'] },
    { fields: ['department_id'] },
    { fields: ['status'] },
    { fields: ['grade_job_title_id'] },
    { fields: ['role_id'] },
  ],
});

export default User;
