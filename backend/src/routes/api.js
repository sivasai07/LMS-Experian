import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import gradeRoutes from './gradeRoutes.js';
import jobTitleRoutes from './jobTitleRoutes.js';
import leaveTypeRoutes from './leaveTypeRoutes.js';
import holidayRoutes from './holidayRoutes.js';
import leaveRequestRoutes from './leaveRequestRoutes.js';
import leaveBalanceRoutes from './leaveBalanceRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import gradeJobTitleController from '../controllers/gradeJobTitleController.js';
import roleController from '../controllers/roleController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const apiV1Router = Router();

// Authentication endpoints (/api/v1/auth)
apiV1Router.use('/auth', authRoutes);

// Authenticated application endpoints (/api/v1/*)
apiV1Router.use(authMiddleware);

apiV1Router.use('/users', userRoutes);
apiV1Router.use('/departments', departmentRoutes);
apiV1Router.use('/grades', gradeRoutes);
apiV1Router.use('/job-titles', jobTitleRoutes);

apiV1Router.get('/grade-job-titles', (req, res, next) =>
  gradeJobTitleController.index(req, res, next)
);
apiV1Router.get('/roles', (req, res, next) =>
  roleController.index(req, res, next)
);

apiV1Router.use('/leave-types', leaveTypeRoutes);
apiV1Router.use('/holidays', holidayRoutes);
apiV1Router.use('/leave-requests', leaveRequestRoutes);
apiV1Router.use('/leave-balances', leaveBalanceRoutes);
apiV1Router.use('/dashboard', dashboardRoutes);

export default apiV1Router;
