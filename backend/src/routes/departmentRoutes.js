import { Router } from 'express';
import departmentController from '../controllers/departmentController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', (req, res, next) => departmentController.index(req, res, next));
router.get('/:id', (req, res, next) => departmentController.show(req, res, next));
router.post('/', roleMiddleware('HR'), (req, res, next) => departmentController.store(req, res, next));
router.put('/:id', roleMiddleware('HR'), (req, res, next) => departmentController.update(req, res, next));
router.delete('/:id', roleMiddleware('HR'), (req, res, next) => departmentController.destroy(req, res, next));

export default router;
