import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const LeaveBalance = sequelize.define('LeaveBalance', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  allocated: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 20.00,
  },
  used: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  balance: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 20.00,
  },
}, {
  tableName: 'leave_balances',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'year'],
    },
  ],
});

export default LeaveBalance;
