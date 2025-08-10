import { Router } from 'express';
import { register, login, logout, getProfile, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(authSchemas.register), register);
router.post('/login', validate(authSchemas.login), login);
// @ts-ignore
router.post('/logout', logout);

// Protected routes
// @ts-ignore
router.get('/profile', authenticateToken, getProfile);
// @ts-ignore
router.get('/profile/:userId', authenticateToken, getProfile);
// @ts-ignore
router.put('/profile', authenticateToken, validate(authSchemas.updateProfile), updateProfile);

export default router; 