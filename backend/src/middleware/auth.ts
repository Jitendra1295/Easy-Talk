import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { IUserResponse } from '../types';

export interface AuthRequest extends Request {
    user?: IUserResponse;
}

/**
 * authenticateToken
 * - Verifies Bearer token from `Authorization` header.
 * - Attaches user (without password) as req.user.
 * - Sends 401/403 JSON responses on failure.
 */
export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers?.authorization ?? (req.get && req.get('authorization'));
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ success: false, message: 'Access token required' });
            return;
        }

        // verifyToken should throw on invalid token or return a decoded payload
        const decoded = verifyToken(token) as { userId?: string } | null;
        if (!decoded || !decoded.userId) {
            res.status(401).json({ success: false, message: 'Invalid token' });
            return;
        }

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }

        req.user = user.toObject() as IUserResponse;
        next();
    } catch (error) {
        console.error('authenticateToken error:', error);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

/**
 * optionalAuth
 * - If token present and valid, attaches req.user; otherwise continues without error.
 */
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers?.authorization ?? (req.get && req.get('authorization'));
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token) as { userId?: string } | null;
            if (decoded?.userId) {
                const user = await User.findById(decoded.userId).select('-password');
                if (user) req.user = user.toObject() as IUserResponse;
            }
        }

        next();
    } catch (error) {
        // don't block request if optional auth fails
        console.warn('optionalAuth warning:', error);
        next();
    }
};
