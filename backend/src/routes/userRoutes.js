import { Router } from 'express';
import profileController from '../controllers/profileController.js';
import teamController from '../controllers/teamController.js';
import userController from '../controllers/userController.js';
import leaveBalanceController from '../controllers/leaveBalanceController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import profilePhotoUpload from '../middleware/uploadMiddleware.js';

const router = Router();

// Employee self-service profile
router.get('/profile', (req, res, next) => profileController.show(req, res, next));
router.put('/profile', profilePhotoUpload, (req, res, next) => profileController.update(req, res, next));

// Team / hierarchy visibility (HR & Manager)
router.get(
  '/direct-reports',
  roleMiddleware('HR', 'Manager'),
  (req, res, next) => teamController.directReports(req, res, next)
);
router.get(
  '/managers',
  roleMiddleware('HR', 'Manager'),
  (req, res, next) => teamController.managers(req, res, next)
);
router.get(
  '/employees',
  roleMiddleware('HR', 'Manager'),
  (req, res, next) => teamController.employees(req, res, next)
);

// HR administration
router.get(
  '/',
  roleMiddleware('HR'),
  (req, res, next) => userController.index(req, res, next)
);
router.post(
  '/',
  roleMiddleware('HR'),
  profilePhotoUpload,
  (req, res, next) => userController.store(req, res, next)
);
router.get(
  '/:id/leave-balances',
  roleMiddleware('HR'),
  (req, res, next) => leaveBalanceController.forUser(req, res, next)
);
router.get(
  '/:id',
  roleMiddleware('HR'),
  (req, res, next) => userController.show(req, res, next)
);
router.put(
  '/:id',
  roleMiddleware('HR'),
  profilePhotoUpload,
  (req, res, next) => userController.update(req, res, next)
);
router.delete(
  '/:id',
  roleMiddleware('HR'),
  (req, res, next) => userController.destroy(req, res, next)
);
router.post(
  '/:id/restore',
  roleMiddleware('HR'),
  (req, res, next) => userController.restore(req, res, next)
);

export default router;
