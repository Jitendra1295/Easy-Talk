export interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
}

export interface Message {
    _id: string;
    content: string;
    sender: User;
    chatId: string;
    messageType: 'text' | 'image' | 'file';
    createdAt: Date;
    updatedAt: Date;
    readBy: string[];
}

export interface Chat {
    _id: string;
    name?: string;
    isGroupChat: boolean;
    participants: User[];
    lastMessage?: Message;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChatPreview {
    _id: string;
    name?: string;
    isGroupChat: boolean;
    participants: User[];
    lastMessage?: {
        content: string;
        sender: User;
        createdAt: Date;
    };
    unreadCount: number;
    updatedAt: Date;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
}

export interface CreateGroupChatData {
    name: string;
    participants: string[];
}

export interface SocketEvents {
    'user:online': (userId: string) => void;
    'user:offline': (userId: string) => void;
    'message:new': (message: Message) => void;
    'message:read': (data: { chatId: string; userId: string }) => void;
    'typing:start': (data: { chatId: string; userId: string }) => void;
    'typing:stop': (data: { chatId: string; userId: string }) => void;
    'chat:created': (chat: Chat) => void;
    'chat:updated': (chat: Chat) => void;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
} 