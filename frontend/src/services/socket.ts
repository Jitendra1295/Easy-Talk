import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types';

class SocketService {
    private socket: Socket | null = null;
    private isConnected = false;

    connect(token: string) {
        if (this.socket?.connected) return;

        const url = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';
        this.socket = io(url, {
            auth: {
                token,
            },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.isConnected = false;
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Join chat room (server expects event: 'joinChat' with chatId as string)
    joinChat(chatId: string) {
        if (this.socket) {
            this.socket.emit('joinChat', chatId);
        }
    }

    // Leave chat room (server expects event: 'leaveChat' with chatId as string)
    leaveChat(chatId: string) {
        if (this.socket) {
            this.socket.emit('leaveChat', chatId);
        }
    }

    // Send typing indicator (server expects single 'typing' event with { chatId, isTyping })
    sendTyping(chatId: string, isTyping: boolean) {
        if (this.socket) {
            this.socket.emit('typing', { chatId, isTyping });
        }
    }

    // Send a message via socket so server can broadcast instantly
    sendMessage(
        chatId: string,
        content: string,
        messageType: 'text' | 'image' | 'file' = 'text',
        options?: { parentMessageId?: string | null; threadRootId?: string | null; forwardedFrom?: { userId: string; chatId: string; messageId: string } | null }
    ) {
        if (this.socket) {
            this.socket.emit('sendMessage', { chatId, content, messageType, ...(options || {}) });
        }
    }

    reactMessage(messageId: string, chatId: string, emoji: string) {
        this.socket?.emit('reactMessage', { messageId, chatId, emoji });
    }

    editMessage(messageId: string, chatId: string, content: string) {
        this.socket?.emit('editMessage', { messageId, chatId, content });
    }

    deleteMessage(messageId: string, chatId: string) {
        this.socket?.emit('deleteMessage', { messageId, chatId });
    }

    // Listen for events
    on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
        if (this.socket) {
            this.socket.on(event, callback as any);
        }
    }

    // Remove event listener
    off<K extends keyof SocketEvents>(event: K) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    // Get connection status
    getConnectionStatus() {
        return this.isConnected;
    }

    // Get socket instance
    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
export default socketService; 