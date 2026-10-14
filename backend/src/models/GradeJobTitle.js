import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const GradeJobTitle = sequelize.define('GradeJobTitle', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  grade_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'grades',
      key: 'id',
    },
  },
  job_title_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'job_titles',
      key: 'id',
    },
  },
}, {
  tableName: 'grade_job_titles',
  indexes: [
    {
      unique: true,
      fields: ['grade_id', 'job_title_id'],
    },
  ],
});

export default GradeJobTitle;
