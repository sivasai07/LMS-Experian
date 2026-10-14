import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  jwtSecret: process.env.JWT_SECRET || 'ot9i7JuWnVMvyaeHwt9qc4ZEoX2YFIv86bVl3bJ7o9XOMjZjYRTzQ4KDF5DsYffA',
  jwtTtlMinutes: parseInt(process.env.JWT_TTL || '60', 10),
  jwtRefreshTtlMinutes: parseInt(process.env.JWT_REFRESH_TTL || '20160', 10),
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USERNAME || '',
    pass: process.env.MAIL_PASSWORD || '',
    fromAddress: process.env.MAIL_FROM_ADDRESS || 'noreply@leavemanagement.test',
    fromName: process.env.MAIL_FROM_NAME || 'LeaveManagement',
  },
  leave: {
    defaultAnnualAllocation: 25.0,
    maxCarryForward: 5.0,
    maxNegativeBalance: 5.0,
  },
  storageDir: path.resolve(__dirname, '../../storage/app/public'),
};

export default config;
