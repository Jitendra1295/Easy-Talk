import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
    IUserResponse,
    IMessageResponse,
    IChatResponse
} from '../types';

export class SocketService {
    private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    private setupMiddleware(): void {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = verifyToken(token);
                const user = await User.findById(decoded.userId).select('-password');

                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.data.userId = user._id;
                socket.data.username = user.username;

                // Update user online status
                await user.updateOnlineStatus(true);

                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });
    }

    private setupEventHandlers(): void {
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.data.username} (${socket.data.userId})`);

            // Store connected user
            this.connectedUsers.set(socket.data.userId, socket.id);

            // Notify other users that this user is online
            socket.broadcast.emit('userOnline', socket.data.userId);

            // Handle joining chats
            socket.on('joinChat', async (chatId) => {
                await this.handleJoinChat(socket, chatId);
            });

            // Handle leaving chats
            socket.on('leaveChat', (chatId) => {
                socket.leave(chatId);
                console.log(`User ${socket.data.username} left chat: ${chatId}`);
            });

            // Handle sending messages
            socket.on('sendMessage', async (data) => {
                await this.handleSendMessage(socket, data);
            });

            // Handle typing indicators
            socket.on('typing', (data) => {
                this.handleTyping(socket, data);
            });

            // Handle marking messages as read
            socket.on('markAsRead', async (messageId) => {
                await this.handleMarkAsRead(socket, messageId);
            });

            // Handle creating groups
            socket.on('createGroup', async (data) => {
                await this.handleCreateGroup(socket, data);
            });

            // Handle joining groups
            socket.on('joinGroup', async (chatId) => {
                await this.handleJoinGroup(socket, chatId);
            });

            // Handle leaving groups
            socket.on('leaveGroup', async (chatId) => {
                await this.handleLeaveGroup(socket, chatId);
            });

            // Handle disconnection
            socket.on('disconnect', async () => {
                await this.handleDisconnect(socket);
            });
        });
    }

    private async handleJoinChat(socket: any, chatId: string): Promise<void> {
        try {
            const userId = socket.data.userId;

            // Check if user is participant in the chat
            const chat = await Chat.findOne({
                _id: chatId,
                participants: userId
            });

            if (!chat) {
                socket.emit('error', { message: 'Chat not found or access denied' });
                return;
            }

            socket.join(chatId);
            console.log(`User ${socket.data.username} joined chat: ${chatId}`);
        } catch (error) {
            console.error('Error joining chat:', error);
            socket.emit('error', { message: 'Error joining chat' });
        }
    }

    private async handleSendMessage(socket: any, data: { chatId: string; content: string; messageType?: 'text' | 'image' | 'file' }): Promise<void> {
        try {
            const userId = socket.data.userId;
            const { chatId, content, messageType = 'text' } = data;

            // Check if user is participant in the chat
            const chat = await Chat.findOne({
                _id: chatId,
                participants: userId
            });

            if (!chat) {
                socket.emit('error', { message: 'Chat not found or access denied' });
                return;
            }

            // Create new message
            const message = new Message({
                sender: userId,
                content,
                messageType,
                chatId,
                readBy: [userId] // Sender has read the message
            });

            await message.save();

            // Populate message with sender details
            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'username email avatar')
                .populate('readBy', 'username email avatar')
                .lean();

            const messageResponse: IMessageResponse = {
                _id: populatedMessage._id,
                sender: populatedMessage.sender,
                content: populatedMessage.content,
                messageType: populatedMessage.messageType,
                chatId: populatedMessage.chatId,
                readBy: populatedMessage.readBy,
                createdAt: populatedMessage.createdAt
            };

            // Update chat's last message
            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: message._id
            });

            // Update unread count for other participants
            const otherParticipants = chat.participants.filter(id => id.toString() !== userId);
            for (const participantId of otherParticipants) {
                const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
                await chat.updateUnreadCount(participantId.toString(), currentCount + 1);
            }

            // Emit message to all participants in the chat
            this.io.to(chatId).emit('message', messageResponse);

            console.log(`Message sent in chat ${chatId} by ${socket.data.username}`);
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Error sending message' });
        }
    }

    private handleTyping(socket: any, data: { chatId: string; isTyping: boolean }): void {
        const { chatId, isTyping } = data;
        const user: IUserResponse = {
            _id: socket.data.userId,
            username: socket.data.username,
            email: '', // Not needed for typing indicator
            avatar: '',
            isOnline: true,
            lastSeen: new Date()
        };

        socket.to(chatId).emit('typing', {
            chatId,
            user,
            isTyping
        });
    }

    private async handleMarkAsRead(socket: any, messageId: string): Promise<void> {
        try {
            const userId = socket.data.userId;

            const message = await Message.findById(messageId);
            if (!message) {
                socket.emit('error', { message: 'Message not found' });
                return;
            }

            // Check if user is participant in the chat
            const chat = await Chat.findOne({
                _id: message.chatId,
                participants: userId
            });

            if (!chat) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Mark message as read
            await message.markAsRead(userId);

            // Emit read receipt
            this.io.to(message.chatId).emit('messageRead', {
                messageId,
                chatId: message.chatId,
                readBy: userId
            });

            // Update unread count
            const currentCount = chat.unreadCount.get(userId) || 0;
            if (currentCount > 0) {
                await chat.updateUnreadCount(userId, currentCount - 1);
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
            socket.emit('error', { message: 'Error marking message as read' });
        }
    }

    private async handleCreateGroup(socket: any, data: { name: string; description?: string; participants: string[] }): Promise<void> {
        try {
            const userId = socket.data.userId;
            const { name, description, participants } = data;

            // Add creator to participants
            const allParticipants = [...participants, userId];

            // Check if all participants exist
            const existingUsers = await User.find({
                _id: { $in: allParticipants }
            });

            if (existingUsers.length !== allParticipants.length) {
                socket.emit('error', { message: 'One or more participants not found' });
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

            const chatResponse: IChatResponse = {
                _id: populatedChat._id,
                type: populatedChat.type,
                participants: populatedChat.participants,
                name: populatedChat.name,
                description: populatedChat.description,
                avatar: populatedChat.avatar,
                admin: populatedChat.admin,
                lastMessage: populatedChat.lastMessage,
                unreadCount: 0,
                createdAt: populatedChat.createdAt
            };

            // Emit new chat to all participants
            for (const participantId of allParticipants) {
                const participantSocketId = this.connectedUsers.get(participantId);
                if (participantSocketId) {
                    this.io.to(participantSocketId).emit('newChat', chatResponse);
                }
            }
        } catch (error) {
            console.error('Error creating group:', error);
            socket.emit('error', { message: 'Error creating group' });
        }
    }

    private async handleJoinGroup(socket: any, chatId: string): Promise<void> {
        try {
            const userId = socket.data.userId;

            const chat = await Chat.findById(chatId);
            if (!chat || chat.type !== 'group') {
                socket.emit('error', { message: 'Group not found' });
                return;
            }

            // Add user to group
            await chat.addParticipant(userId);

            const user = await User.findById(userId).select('username email avatar isOnline lastSeen');

            // Emit user joined event
            this.io.to(chatId).emit('userJoined', {
                chatId,
                user
            });

            socket.join(chatId);
            console.log(`User ${socket.data.username} joined group: ${chatId}`);
        } catch (error) {
            console.error('Error joining group:', error);
            socket.emit('error', { message: 'Error joining group' });
        }
    }

    private async handleLeaveGroup(socket: any, chatId: string): Promise<void> {
        try {
            const userId = socket.data.userId;

            const chat = await Chat.findById(chatId);
            if (!chat || chat.type !== 'group') {
                socket.emit('error', { message: 'Group not found' });
                return;
            }

            // Remove user from group
            await chat.removeParticipant(userId);

            // Emit user left event
            this.io.to(chatId).emit('userLeft', {
                chatId,
                userId
            });

            socket.leave(chatId);
            console.log(`User ${socket.data.username} left group: ${chatId}`);
        } catch (error) {
            console.error('Error leaving group:', error);
            socket.emit('error', { message: 'Error leaving group' });
        }
    }

    private async handleDisconnect(socket: any): Promise<void> {
        try {
            const userId = socket.data.userId;

            // Remove from connected users
            this.connectedUsers.delete(userId);

            // Update user offline status
            const user = await User.findById(userId);
            if (user) {
                await user.updateOnlineStatus(false);
            }

            // Notify other users that this user is offline
            socket.broadcast.emit('userOffline', userId);

            console.log(`User disconnected: ${socket.data.username} (${userId})`);
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    }

    public getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
        return this.io;
    }
} 