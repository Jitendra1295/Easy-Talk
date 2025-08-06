import { Router } from 'express';
import {
    getChats,
    getChat,
    getMessages,
    createPrivateChat,
    createGroupChat,
    markMessagesAsRead,
    searchUsers,
    sendMessage
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';
import { validate, chatSchemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Chat routes
router.get('/chats', getChats);
router.get('/chats/:chatId', getChat);
router.post('/chats/:chatId/messages', sendMessage);
router.get('/chats/:chatId/messages', getMessages);
router.post('/chats/private', createPrivateChat);
router.post('/chats/group', validate(chatSchemas.createGroup), createGroupChat);
router.put('/chats/:chatId/read', markMessagesAsRead);

// User search
router.get('/users/search', searchUsers);

export default router; 