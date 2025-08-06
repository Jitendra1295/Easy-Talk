import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
        }

        next();
    };
};

// Validation schemas
export const authSchemas = {
    register: Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    updateProfile: Joi.object({
        username: Joi.string().min(3).max(30).optional(),
        avatar: Joi.string().optional()
    })
};

export const chatSchemas = {
    createGroup: Joi.object({
        name: Joi.string().min(1).max(50).required(),
        description: Joi.string().max(200).optional(),
        participants: Joi.array().items(Joi.string()).min(2).required()
    }),

    sendMessage: Joi.object({
        content: Joi.string().min(1).max(1000).required(),
        messageType: Joi.string().valid('text', 'image', 'file').optional()
    }),

    updateProfile: Joi.object({
        username: Joi.string().min(3).max(30).optional(),
        avatar: Joi.string().optional()
    })
}; 