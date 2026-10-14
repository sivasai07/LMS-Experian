import { Router } from 'express';
import dashboardController from '../controllers/dashboardController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/employee', (req, res, next) => dashboardController.employee(req, res, next));
router.get(
  '/manager',
  roleMiddleware('HR', 'Manager'),
  (req, res, next) => dashboardController.manager(req, res, next)
);
router.get(
  '/hr',
  roleMiddleware('HR'),
  (req, res, next) => dashboardController.hr(req, res, next)
);

export default router;
