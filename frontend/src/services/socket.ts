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
            this.socket.emit('join:chat', { chatId });
        }
    }

    // Leave chat room
    leaveChat(chatId: string) {
        if (this.socket) {
            this.socket.emit('leave:chat', { chatId });
        }
    }

    // Send typing indicator
    sendTyping(chatId: string, isTyping: boolean) {
        if (this.socket) {
            if (isTyping) {
                this.socket.emit('typing:start', { chatId });
            } else {
                this.socket.emit('typing:stop', { chatId });
            }
        }
    }

    // Mark messages as read
    markAsRead(chatId: string) {
        if (this.socket) {
            this.socket.emit('message:read', { chatId });
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