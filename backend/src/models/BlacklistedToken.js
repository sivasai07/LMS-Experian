import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const BlacklistedToken = sequelize.define('BlacklistedToken', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'blacklisted_tokens',
});

export default BlacklistedToken;
