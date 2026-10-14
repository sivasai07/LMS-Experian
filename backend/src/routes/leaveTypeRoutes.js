import { Router } from 'express';
import leaveTypeController from '../controllers/leaveTypeController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', (req, res, next) => leaveTypeController.index(req, res, next));
router.get('/:id', (req, res, next) => leaveTypeController.show(req, res, next));
router.post('/', roleMiddleware('HR'), (req, res, next) => leaveTypeController.store(req, res, next));
router.put('/:id', roleMiddleware('HR'), (req, res, next) => leaveTypeController.update(req, res, next));
router.delete('/:id', roleMiddleware('HR'), (req, res, next) => leaveTypeController.destroy(req, res, next));

export default router;
