import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types';

class SocketService {
    private socket: Socket | null = null;
    private isConnected = false;

    connect(token: string) {
        if (this.socket?.connected) return;

        this.socket = io('http://localhost:5000', {
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

    // Join chat room
    joinChat(chatId: string) {
        if (this.socket) {
            this.socket.emit('joinChat', chatId);
        }
    }

    // Leave chat room
    leaveChat(chatId: string) {
        if (this.socket) {
            this.socket.emit('leaveChat', chatId);
        }
    }

    // Send a message via socket
    sendMessage(chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text') {
        if (this.socket) {
            this.socket.emit('sendMessage', { chatId, content, messageType });
        }
    }

    // Send typing indicator
    sendTyping(chatId: string, isTyping: boolean) {
        if (this.socket) {
            this.socket.emit('typing', { chatId, isTyping });
        }
    }

    // Note: server expects messageId for markAsRead; we keep this unused for now
    markAsRead(messageId: string) {
        if (this.socket) {
            this.socket.emit('markAsRead', messageId);
        }
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