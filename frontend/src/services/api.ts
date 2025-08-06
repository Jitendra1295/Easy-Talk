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
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/me');
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
    console.log('🚀 API: Making getChats request to /chats');
    try {
      const response: AxiosResponse<ApiResponse<ChatPreview[]>> = await this.api.get('/chats');
      console.log('✅ API: getChats response:', response.data);
      return response.data.data!;
    } catch (error) {
      console.error('❌ API: getChats error:', error);
      throw error;
    }
  }

  async getChatById(chatId: string): Promise<Chat> {
    const response: AxiosResponse<ApiResponse<Chat>> = await this.api.get(`/chats/${chatId}`);
    return response.data.data!;
  }

  async createPrivateChat(userId: string): Promise<Chat> {
    const response: AxiosResponse<ApiResponse<Chat>> = await this.api.post('/chats/private', {
      participantId: userId, // <-- userId is the person you're chatting with
    });

    return response.data.data!;
  }


  async createGroupChat(data: CreateGroupChatData): Promise<Chat> {
    const response: AxiosResponse<ApiResponse<Chat>> = await this.api.post('/chats/group', data);
    return response.data.data!;
  }

  async updateChat(chatId: string, data: Partial<Chat>): Promise<Chat> {
    const response: AxiosResponse<ApiResponse<Chat>> = await this.api.put(`/chats/${chatId}`, data);
    return response.data.data!;
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