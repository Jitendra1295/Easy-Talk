import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/authController';
import { searchUsers } from '../controllers/chatController';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();

// Get all users (excluding current user)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const currentUserId = req.user?._id;
        console.log('Get users request - currentUserId:', currentUserId);

        const users = await User.find({ _id: { $ne: currentUserId } })
            .select('username email avatar isOnline lastSeen')
            .lean();

        // console.log('Found users:', users.length);
        // console.log('Users:', users);

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get current user profile
// @ts-ignore

router.get('/me', authenticateToken, getProfile);

// Get user by ID
// @ts-ignore

router.get('/:userId', authenticateToken, getProfile);

// Update user profile
// @ts-ignore

router.put('/profile', authenticateToken, updateProfile);

// Search users
router.get('/search', authenticateToken, searchUsers);

export default router; 