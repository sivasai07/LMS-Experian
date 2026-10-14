import { Router } from 'express';
import leaveBalanceController from '../controllers/leaveBalanceController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/my', (req, res, next) => leaveBalanceController.my(req, res, next));
router.get('/:id', roleMiddleware('HR'), (req, res, next) => leaveBalanceController.forUser(req, res, next));

export default router;
