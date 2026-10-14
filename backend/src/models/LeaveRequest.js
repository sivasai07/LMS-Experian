import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const LeaveRequest = sequelize.define('LeaveRequest', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  leave_type_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'leave_types',
      key: 'id',
    },
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  working_days: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: false,
  },
  is_half_day: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  half_day_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  start_half_day: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  end_half_day: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  reason: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  processed_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  cancelled_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancellation_reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'leave_requests',
  indexes: [
    { fields: ['employee_id', 'status'] },
    { fields: ['start_date', 'end_date'] },
    { fields: ['processed_by', 'status'] },
  ],
});

export default LeaveRequest;
