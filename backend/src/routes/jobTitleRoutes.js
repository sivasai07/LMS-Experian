import { Router } from 'express';
import jobTitleController from '../controllers/jobTitleController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', (req, res, next) => jobTitleController.index(req, res, next));
router.get('/:id', (req, res, next) => jobTitleController.show(req, res, next));
router.post('/', roleMiddleware('HR'), (req, res, next) => jobTitleController.store(req, res, next));
router.put('/:id', roleMiddleware('HR'), (req, res, next) => jobTitleController.update(req, res, next));
router.delete('/:id', roleMiddleware('HR'), (req, res, next) => jobTitleController.destroy(req, res, next));

export default router;
