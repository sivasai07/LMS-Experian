import { Router } from 'express';
import leaveRequestController from '../controllers/leaveRequestController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/my', (req, res, next) => leaveRequestController.my(req, res, next));

router.get(
  '/pending',
  roleMiddleware('HR', 'Manager'),
  (req, res, next) => leaveRequestController.pending(req, res, next)
);

router.get(
  '/',
  roleMiddleware('HR'),
  (req, res, next) => leaveRequestController.index(req, res, next)
);

router.post('/', (req, res, next) => leaveRequestController.apply(req, res, next));
router.get('/:id', (req, res, next) => leaveRequestController.show(req, res, next));
router.post('/:id/cancel', (req, res, next) => leaveRequestController.cancel(req, res, next));
router.post('/:id/approve', (req, res, next) => leaveRequestController.approve(req, res, next));
router.post('/:id/reject', (req, res, next) => leaveRequestController.reject(req, res, next));

export default router;
