import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Chat, ChatPreview, Message, User } from '@/types';
import apiService from '@/services/api';
import socketService from '@/services/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface ChatContextType {
    chats: ChatPreview[];
    currentChat: Chat | null;
    messages: Message[];
    typingUsers: string[];
    setCurrentChat: (chat: Chat | null) => void;
    sendMessage: (content: string, messageType?: 'text' | 'image' | 'file') => Promise<void>;
    createPrivateChat: (userId: string) => Promise<void>;
    createGroupChat: (name: string, participants: string[]) => Promise<void>;
    markAsRead: () => void;
    sendTyping: (isTyping: boolean) => void;
    loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [currentChat, setCurrentChat] = useState<Chat | null>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    // Fetch chats
    const {
        data: chats = [],
        isLoading: chatsLoading,
        refetch: refetchChats,
    } = useQuery({
        queryKey: ['chats'],
        queryFn: apiService.getChats,
        enabled: !!user,
    });

    // Fetch current chat details
    const {
        data: currentChatData,
        isLoading: currentChatLoading,
        refetch: refetchCurrentChat,
    } = useQuery({
        queryKey: ['chat', currentChat?._id],
        queryFn: () => apiService.getChatById(currentChat!._id),
        enabled: !!currentChat?._id,
    });

    // Fetch messages for current chat
    const {
        data: messages = [],
        isLoading: messagesLoading,
        refetch: refetchMessages,
    } = useQuery({
        queryKey: ['messages', currentChat?._id],
        queryFn: () => apiService.getMessages(currentChat!._id),
        enabled: !!currentChat?._id,
    });

    useEffect(() => {
        console.log('user in ChatProvider:', user);
    }, [user]);

    // Socket event handlers
    useEffect(() => {
        if (!user) return;

        const handleNewMessage = (message: Message) => {
            // Update messages in current chat
            if (currentChat && message.chatId === currentChat._id) {
                queryClient.setQueryData(['messages', currentChat._id], (old: Message[] = []) => {
                    return [message, ...old];
                });
            }

            // Update chat preview
            queryClient.setQueryData(['chats'], (old: ChatPreview[] = []) => {
                return old.map(chat => {
                    if (chat._id === message.chatId) {
                        return {
                            ...chat,
                            lastMessage: {
                                content: message.content,
                                sender: message.sender,
                                createdAt: message.createdAt,
                            },
                            unreadCount: chat.unreadCount + 1,
                            updatedAt: message.createdAt,
                        };
                    }
                    return chat;
                });
            });
        };

        const handleTypingStart = (data: { chatId: string; userId: string }) => {
            if (currentChat && data.chatId === currentChat._id) {
                setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
            }
        };

        const handleTypingStop = (data: { chatId: string; userId: string }) => {
            if (currentChat && data.chatId === currentChat._id) {
                setTypingUsers(prev => prev.filter(id => id !== data.userId));
            }
        };

        const handleMessageRead = (data: { chatId: string; userId: string }) => {
            if (data.userId === user._id) {
                queryClient.setQueryData(['chats'], (old: ChatPreview[] = []) => {
                    return old.map(chat => {
                        if (chat._id === data.chatId) {
                            return { ...chat, unreadCount: 0 };
                        }
                        return chat;
                    });
                });
            }
        };

        const handleChatCreated = (chat: Chat) => {
            queryClient.setQueryData(['chats'], (old: ChatPreview[] = []) => {
                return [chat as ChatPreview, ...old];
            });
            toast.success('New chat created!');
        };

        const handleChatUpdated = (chat: Chat) => {
            queryClient.setQueryData(['chats'], (old: ChatPreview[] = []) => {
                return old.map(c => c._id === chat._id ? chat as ChatPreview : c);
            });
        };

        // Set up socket listeners
        socketService.on('message:new', handleNewMessage);
        socketService.on('typing:start', handleTypingStart);
        socketService.on('typing:stop', handleTypingStop);
        socketService.on('message:read', handleMessageRead);
        socketService.on('chat:created', handleChatCreated);
        socketService.on('chat:updated', handleChatUpdated);

        return () => {
            socketService.off('message:new');
            socketService.off('typing:start');
            socketService.off('typing:stop');
            socketService.off('message:read');
            socketService.off('chat:created');
            socketService.off('chat:updated');
        };
    }, [user, currentChat, queryClient]);

    // Join/leave chat rooms
    useEffect(() => {
        if (currentChat) {
            socketService.joinChat(currentChat._id);
            return () => {
                socketService.leaveChat(currentChat._id);
            };
        }
    }, [currentChat]);

    const sendMessage = async (content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
        if (!currentChat) return;

        try {
            const message = await apiService.sendMessage(currentChat._id, content, messageType);

            // Optimistically update messages
            queryClient.setQueryData(['messages', currentChat._id], (old: Message[] = []) => {
                return [message, ...old];
            });

            // Update chat preview
            queryClient.setQueryData(['chats'], (old: ChatPreview[] = []) => {
                return old.map(chat => {
                    if (chat._id === currentChat._id) {
                        return {
                            ...chat,
                            lastMessage: {
                                content: message.content,
                                sender: message.sender,
                                createdAt: message.createdAt,
                            },
                            updatedAt: message.createdAt,
                        };
                    }
                    return chat;
                });
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send message');
            throw error;
        }
    };

    const createPrivateChat = async (userId: string) => {
        try {
            const chat = await apiService.createPrivateChat(userId);
            setCurrentChat(chat);
            await refetchChats();
            toast.success('Private chat created!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create private chat');
            throw error;
        }
    };

    const createGroupChat = async (name: string, participants: string[]) => {
        try {
            const chat = await apiService.createGroupChat({ name, participants });
            setCurrentChat(chat);
            await refetchChats();
            toast.success('Group chat created!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create group chat');
            throw error;
        }
    };

    const markAsRead = async () => {
        if (!currentChat) return;

        try {
            await apiService.markMessagesAsRead(currentChat._id);
            socketService.markAsRead(currentChat._id);

            // Update unread count
            queryClient.setQueryData(['chats'], (old: ChatPreview[] = []) => {
                return old.map(chat => {
                    if (chat._id === currentChat._id) {
                        return { ...chat, unreadCount: 0 };
                    }
                    return chat;
                });
            });
        } catch (error) {
            console.error('Failed to mark messages as read:', error);
        }
    };

    const sendTyping = (isTyping: boolean) => {
        if (currentChat) {
            socketService.sendTyping(currentChat._id, isTyping);
        }
    };

    const value: ChatContextType = {
        chats,
        currentChat: currentChatData || currentChat,
        messages,
        typingUsers,
        setCurrentChat,
        sendMessage,
        createPrivateChat,
        createGroupChat,
        markAsRead,
        sendTyping,
        loading: chatsLoading || currentChatLoading || messagesLoading,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}; 