import { Router } from 'express';
import gradeController from '../controllers/gradeController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', (req, res, next) => gradeController.index(req, res, next));
router.get('/:id', (req, res, next) => gradeController.show(req, res, next));
router.post('/', roleMiddleware('HR'), (req, res, next) => gradeController.store(req, res, next));
router.put('/:id', roleMiddleware('HR'), (req, res, next) => gradeController.update(req, res, next));
router.delete('/:id', roleMiddleware('HR'), (req, res, next) => gradeController.destroy(req, res, next));

export default router;
