import { Router } from 'express';
import { register, login, logout, getProfile, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(authSchemas.register), register);
router.post('/login', validate(authSchemas.login), login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/profile/:userId', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validate(authSchemas.updateProfile), updateProfile);

export default router; 