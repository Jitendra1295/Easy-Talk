import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types';

// interface ImportMetaEnv extends Record<string, string> {
//     VITE_SOCKET_URL: string;
// }

class SocketService {
    private socket: Socket | null = null;
    private isConnected = false;

    connect(token: string) {
        if (this.socket?.connected) return;

        // Use environment variable for Render production
        const url = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';

        this.socket = io(url, {
            auth: { token },
            transports: ['websocket'], // Prefer websocket to avoid Render long-polling delays
            secure: true, // Ensure secure WS on https
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to socket server');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('⚠️ Disconnected from socket server');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message || error);
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

    joinChat(chatId: string) {
        this.socket?.emit('joinChat', chatId);
    }

    leaveChat(chatId: string) {
        this.socket?.emit('leaveChat', chatId);
    }

    sendTyping(chatId: string, isTyping: boolean) {
        this.socket?.emit('typing', { chatId, isTyping });
    }

    sendMessage(chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text', options?: any) {
        this.socket?.emit('sendMessage', { chatId, content, messageType, ...(options || {}) });
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

    on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
        this.socket?.on(event, callback as any);
    }

    off<K extends keyof SocketEvents>(event: K) {
        this.socket?.off(event);
    }

    getConnectionStatus() {
        return this.isConnected;
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
export default socketService;
