import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { IChatResponse, IMessageResponse, IUserResponse, PaginationParams } from '../types';

export const getChats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        console.log('User ID:', req);
        const userId = req.user?._id;
        console.log('User ID:', userId);
        const { page = 1, limit = 20 } = req.query as PaginationParams;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const skip = (page - 1) * limit;

        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'username email avatar isOnline lastSeen')
            .populate('lastMessage')
            .populate('admin', 'username email avatar')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Chat.countDocuments({ participants: userId });

        // Transform chats to include unread count for current user
        const transformedChats: IChatResponse[] = chats.map(chat => ({
            _id: chat._id,
            type: chat.type,
            participants: chat.participants as unknown as IUserResponse[],
            name: chat.name,
            description: chat.description,
            avatar: chat.avatar,
            admin: chat.admin as unknown as IUserResponse | undefined,
            lastMessage: chat.lastMessage as unknown as IMessageResponse | undefined,
            unreadCount: (chat.unreadCount as any)[userId] || 0,
            createdAt: chat.createdAt
        }));

        res.status(200).json({
            success: true,
            message: 'Chats retrieved successfully',
            data: transformedChats,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getChat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { chatId } = req.params;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        })
            .populate('participants', 'username email avatar isOnline lastSeen')
            .populate('lastMessage')
            .populate('admin', 'username email avatar')
            .lean();

        if (!chat) {
            res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
            return;
        }

        const chatResponse: IChatResponse = {
            _id: chat._id,
            type: chat.type,
            participants: chat.participants as unknown as IUserResponse[],
            name: chat.name,
            description: chat.description,
            avatar: chat.avatar,
            admin: chat.admin as unknown as IUserResponse | undefined,
            lastMessage: chat.lastMessage as unknown as IMessageResponse | undefined,
            unreadCount: (chat.unreadCount as any)[userId] || 0,
            createdAt: chat.createdAt
        };

        res.status(200).json({
            success: true,
            message: 'Chat retrieved successfully',
            data: chatResponse
        });
    } catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { chatId } = req.params;
        const { page = 1, limit = 50 } = req.query as PaginationParams;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        // Check if user is participant in the chat
        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
            return;
        }

        const result = await (Message as any).getMessagesForChat(chatId, Number(page), Number(limit));

        // Transform messages to include sender details
        const transformedMessages: IMessageResponse[] = result.messages.map((message: any) => ({
            _id: message._id,
            sender: message.sender,
            content: message.content,
            messageType: message.messageType,
            chatId: message.chatId,
            readBy: message.readBy,
            createdAt: message.createdAt
        }));

        res.status(200).json({
            success: true,
            message: 'Messages retrieved successfully',
            data: transformedMessages,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const createPrivateChat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { participantId } = req.body;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        if (!participantId) {
            res.status(400).json({
                success: false,
                message: 'Participant ID required'
            });
            return;
        }

        // Check if participant exists
        const participant = await User.findById(participantId);
        if (!participant) {
            res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
            return;
        }

        // Find or create private chat
        const chat = await (Chat as any).findOrCreatePrivateChat(userId, participantId);

        // Populate chat with participant details
        const populatedChat = await Chat.findById(chat._id)
            .populate('participants', 'username email avatar isOnline lastSeen')
            .lean();

        if (!populatedChat) {
            res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
            return;
        }

        const chatResponse: IChatResponse = {
            _id: populatedChat._id,
            type: populatedChat.type,
            participants: populatedChat.participants as unknown as IUserResponse[],
            name: populatedChat.name,
            description: populatedChat.description,
            avatar: populatedChat.avatar,
            admin: populatedChat.admin as unknown as IUserResponse | undefined,
            lastMessage: populatedChat.lastMessage as unknown as IMessageResponse | undefined,
            unreadCount: 0,
            createdAt: populatedChat.createdAt
        };

        res.status(200).json({
            success: true,
            message: 'Private chat created successfully',
            data: chatResponse
        });
    } catch (error) {
        console.error('Create private chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const createGroupChat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { name, description, participants } = req.body;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        if (!name || !participants || participants.length < 2) {
            res.status(400).json({
                success: false,
                message: 'Name and at least 2 participants required'
            });
            return;
        }

        // Add creator to participants
        const allParticipants = [...participants, userId];

        // Check if all participants exist
        const existingUsers = await User.find({
            _id: { $in: allParticipants }
        });

        if (existingUsers.length !== allParticipants.length) {
            res.status(400).json({
                success: false,
                message: 'One or more participants not found'
            });
            return;
        }

        const chat = new Chat({
            type: 'group',
            name,
            description,
            participants: allParticipants,
            admin: userId
        });

        await chat.save();

        const populatedChat = await Chat.findById(chat._id)
            .populate('participants', 'username email avatar isOnline lastSeen')
            .populate('admin', 'username email avatar')
            .lean();

        if (!populatedChat) {
            res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
            return;
        }

        const chatResponse: IChatResponse = {
            _id: populatedChat._id,
            type: populatedChat.type,
            participants: populatedChat.participants as unknown as IUserResponse[],
            name: populatedChat.name,
            description: populatedChat.description,
            avatar: populatedChat.avatar,
            admin: populatedChat.admin as unknown as IUserResponse | undefined,
            lastMessage: populatedChat.lastMessage as unknown as IMessageResponse | undefined,
            unreadCount: 0,
            createdAt: populatedChat.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'Group chat created successfully',
            data: chatResponse
        });
    } catch (error) {
        console.error('Create group chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { chatId } = req.params;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        // Check if user is participant in the chat
        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
            return;
        }

        // Mark all unread messages as read
        await Message.updateMany(
            {
                chatId,
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            {
                $addToSet: { readBy: userId }
            }
        );

        // Reset unread count for this user
        await (chat as any).resetUnreadCount(userId);

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark messages as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { query } = req.query;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        if (!query || typeof query !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Search query required'
            });
            return;
        }

        const users = await User.find({
            _id: { $ne: userId },
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        })
            .select('username email avatar isOnline lastSeen')
            .limit(10)
            .lean();

        res.status(200).json({
            success: true,
            message: 'Users found successfully',
            data: users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { chatId } = req.params;
        const { content, messageType = 'text' } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        if (!content) {
            res.status(400).json({ success: false, message: 'Message content required' });
            return;
        }

        // Check if user is participant
        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) {
            res.status(404).json({ success: false, message: 'Chat not found' });
            return;
        }

        const message = await Message.create({
            chatId,
            sender: userId,
            content,
            messageType,
            readBy: [userId]
        });

        // Optionally update chat's lastMessage
        // @ts-ignore
        chat.lastMessage = message;
        await chat.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};