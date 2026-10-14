import { Router } from 'express';
import holidayController from '../controllers/holidayController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', (req, res, next) => holidayController.index(req, res, next));
router.get('/:id', (req, res, next) => holidayController.show(req, res, next));
router.post('/', roleMiddleware('HR'), (req, res, next) => holidayController.store(req, res, next));
router.put('/:id', roleMiddleware('HR'), (req, res, next) => holidayController.update(req, res, next));
router.delete('/:id', roleMiddleware('HR'), (req, res, next) => holidayController.destroy(req, res, next));

export default router;
