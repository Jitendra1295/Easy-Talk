import { Document, Model } from 'mongoose';

// User related types
export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateOnlineStatus(isOnline: boolean): Promise<IUser>;
}

export interface IUserResponse {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

// Message related types
export interface IMessage extends Document {
  _id: string;
  sender: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  chatId: string;
  readBy: string[];
  deliveredTo?: string[];
  parentMessageId?: string | null;
  threadRootId?: string | null;
  forwardedFrom?: { userId: string; chatId: string; messageId: string; at: Date } | null;
  reactions?: Record<string, string[]>; // { '👍': ['userId1'] }
  editedAt?: Date | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageModel extends Model<IMessage> {
  getMessagesForChat(chatId: string, page: number, limit: number): Promise<{
    messages: IMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
}

export interface IMessageResponse {
  _id: string;
  sender: IUserResponse;
  content: string;
  messageType: 'text' | 'image' | 'file';
  chatId: string;
  readBy: string[];
  deliveredTo?: string[];
  parentMessageId?: string | null;
  threadRootId?: string | null;
  forwardedFrom?: { userId: string; chatId: string; messageId: string; at: Date } | null;
  reactions?: Record<string, string[]>;
  editedAt?: Date | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
}

// Chat related types
export interface IChat extends Document {
  _id: string;
  type: 'private' | 'group';
  participants: string[];
  name?: string; // For group chats
  description?: string; // For group chats
  avatar?: string; // For group chats
  admin?: string; // For group chats
  lastMessage?: IMessage;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
  // findOrCreatePrivateChat(userId1: string, userId2: string): Promise<IChat>;
  resetUnreadCount(userId: string): Promise<void>;
}

export interface IChatResponse {
  _id: string;
  type: 'private' | 'group';
  participants: IUserResponse[];
  name?: string;
  description?: string;
  avatar?: string;
  admin?: IUserResponse;
  lastMessage?: IMessageResponse;
  unreadCount: number;
  createdAt: Date;
}

// Socket.IO event types
export interface ServerToClientEvents {
  message: (message: IMessageResponse) => void;
  typing: (data: { chatId: string; user: IUserResponse; isTyping: boolean }) => void;
  userOnline: (userId: string) => void;
  userOffline: (userId: string) => void;
  messageRead: (data: { messageId: string; chatId: string; readBy: string }) => void;
  newChat: (chat: IChatResponse) => void;
  chatUpdated: (chat: IChatResponse) => void;
  userJoined: (data: { chatId: string; user: IUserResponse }) => void;
  userLeft: (data: { chatId: string; userId: string }) => void;
  messageUpdated: (message: IMessageResponse) => void;
  messageDeleted: (data: { messageId: string; chatId: string; deletedBy: string }) => void;
  reactionUpdated: (data: { messageId: string; chatId: string; emoji: string; userId: string; action: 'add' | 'remove'; reactions: Record<string, string[]> }) => void;
}

export interface ClientToServerEvents {
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (data: { chatId: string; content: string; messageType?: 'text' | 'image' | 'file' }) => void;
  typing: (data: { chatId: string; isTyping: boolean }) => void;
  markAsRead: (messageId: string) => void;
  createGroup: (data: { name: string; description?: string; participants: string[] }) => void;
  joinGroup: (chatId: string) => void;
  leaveGroup: (chatId: string) => void;
  reactMessage: (data: { messageId: string; chatId: string; emoji: string }) => void;
  editMessage: (data: { messageId: string; chatId: string; content: string }) => void;
  deleteMessage: (data: { messageId: string; chatId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUserResponse;
  token: string;
}

// Request with user context
export interface AuthenticatedRequest extends Request {
  user?: IUserResponse;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 