import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Message,
  Chat,
  ChatPreview,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  CreateGroupChatData,
  ApiResponse
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // --- helpers to normalize API -> frontend types ---
  private mapChatPreview(apiChat: any): ChatPreview {
    return {
      _id: apiChat._id,
      name: apiChat.name,
      isGroupChat: apiChat.type === 'group',
      participants: apiChat.participants,
      lastMessage: apiChat.lastMessage
        ? {
          content: apiChat.lastMessage.content,
          sender: apiChat.lastMessage.sender,
          createdAt: apiChat.lastMessage.createdAt,
        }
        : undefined,
      unreadCount: apiChat.unreadCount ?? 0,
      updatedAt: apiChat.lastMessage?.createdAt ?? apiChat.createdAt,
    } as ChatPreview;
  }

  private mapChat(apiChat: any): Chat {
    return {
      _id: apiChat._id,
      name: apiChat.name,
      isGroupChat: apiChat.type === 'group',
      participants: apiChat.participants,
      lastMessage: apiChat.lastMessage,
      unreadCount: apiChat.unreadCount ?? 0,
      createdAt: apiChat.createdAt,
      updatedAt: apiChat.updatedAt ?? (apiChat.lastMessage?.createdAt || apiChat.createdAt),
    } as Chat;
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/login', credentials);
    return response.data.data!;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/register', credentials);
    return response.data.data!;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  async getCurrentUser(): Promise<User> {
    // Backend exposes current user at /api/users/me
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/users/me');
    return response.data.data!;
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    const response: AxiosResponse<ApiResponse<User[]>> = await this.api.get('/users');
    console.log(response, "response.data.data::");
    return response.data.data!;
  }

  async getUserById(userId: string): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(`/users/${userId}`);
    return response.data.data!;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put('/users/profile', data);
    return response.data.data!;
  }

  // Chat endpoints
  async getChats(): Promise<ChatPreview[]> {
    try {
      console.log("getChats response:");
      const response: AxiosResponse<ApiResponse<ChatPreview[]>> = await this.api.get('/chats');
      console.log(response, "response.data.data::");
      const raw = (response.data as any).data || [];
      return raw.map((c: any) => this.mapChatPreview(c));
    } catch (error: any) {
      console.error("❌ getChats failed:", error.response?.data || error.message);
      throw error; // ensure React Query sees the error
    }
  }


  async getChatById(chatId: string): Promise<Chat> {
    const response: AxiosResponse<ApiResponse<Chat>> = await this.api.get(`/chats/${chatId}`);
    const raw = (response.data as any).data;
    return this.mapChat(raw);
  }

  async createPrivateChat(userId: string): Promise<Chat> {
    const response: AxiosResponse<ApiResponse<Chat>> = await this.api.post('/chats/private', {
      participantId: userId,
    });
    const raw = (response.data as any).data;
    return this.mapChat(raw);
  }


  async createGroupChat(data: CreateGroupChatData): Promise<Chat> {
    const response: AxiosResponse<ApiResponse<Chat>> = await this.api.post('/chats/group', data);
    const raw = (response.data as any).data;
    return this.mapChat(raw);
  }

  async updateChat(chatId: string, data: Partial<Chat>): Promise<Chat> {
    const response: AxiosResponse<ApiResponse<Chat>> = await this.api.put(`/chats/${chatId}`, data);
    const raw = (response.data as any).data;
    return this.mapChat(raw);
  }

  async deleteChat(chatId: string): Promise<void> {
    await this.api.delete(`/chats/${chatId}`);
  }

  // Message endpoints
  async getMessages(chatId: string, page = 1, limit = 50): Promise<Message[]> {
    const response: AxiosResponse<ApiResponse<Message[]>> = await this.api.get(
      `/chats/${chatId}/messages?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  }

  async sendMessage(chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<Message> {
    const response: AxiosResponse<ApiResponse<Message>> = await this.api.post(`/chats/${chatId}/messages`, {
      content,
      messageType,
    });
    return response.data.data!;
  }

  async markMessagesAsRead(chatId: string): Promise<void> {
    await this.api.put(`/chats/${chatId}/read`);
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    await this.api.delete(`/chats/${chatId}/messages/${messageId}`);
  }

  // File upload
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<ApiResponse<{ url: string }>> = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }
}

export const apiService = new ApiService();
export default apiService; 