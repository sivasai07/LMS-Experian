import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const Grade = sequelize.define('Grade', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'grades',
});

export default Grade;
