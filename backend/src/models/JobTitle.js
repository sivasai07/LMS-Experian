import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const JobTitle = sequelize.define('JobTitle', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'job_titles',
});

export default JobTitle;
