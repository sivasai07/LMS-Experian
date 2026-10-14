import { Router } from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', (req, res, next) => authController.login(req, res, next));

router.use(authMiddleware);
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.get('/me', (req, res, next) => authController.me(req, res, next));
router.post('/change-password', (req, res, next) => authController.changePassword(req, res, next));

export default router;
