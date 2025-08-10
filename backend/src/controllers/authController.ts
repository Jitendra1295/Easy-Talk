import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username, email, password }: RegisterRequest = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            res.status(400).json({ success: false, message: 'User with this email or username already exists' });
            return;
        }

        const user = new User({ username, email, password });
        await user.save();

        const token = generateToken(user.toObject());

        const response: AuthResponse = {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen,
            },
            token,
        };

        res.status(201).json({ success: true, message: 'User registered successfully', data: response });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password }: LoginRequest = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        await user.updateOnlineStatus(true);
        const token = generateToken(user.toObject());

        const response: AuthResponse = {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen,
            },
            token,
        };

        res.status(200).json({ success: true, message: 'Login successful', data: response });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id || req.body.userId;

        if (userId) {
            const user = await User.findById(userId);
            if (user) await user.updateOnlineStatus(false);
        }

        res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId || req.user?._id;

        if (!userId) {
            res.status(400).json({ success: false, message: 'User ID required' });
            return;
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({ success: true, message: 'Profile retrieved successfully', data: user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { username, avatar } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                res.status(400).json({ success: false, message: 'Username already taken' });
                return;
            }
            user.username = username;
        }

        if (avatar) user.avatar = avatar;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
