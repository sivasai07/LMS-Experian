import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const Holiday = sequelize.define('Holiday', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  holiday_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  holiday_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'holidays',
  indexes: [
    {
      unique: true,
      fields: ['holiday_name', 'holiday_date'],
    },
    {
      fields: ['holiday_date'],
    },
  ],
});

export default Holiday;
