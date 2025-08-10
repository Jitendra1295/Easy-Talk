import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Chat, ChatPreview, Message } from '@/types';
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

    // Enhanced setCurrentChat function with persistence
    const setCurrentChatWithPersistence = (chat: Chat | null) => {
        setCurrentChat(chat);
        if (chat && user) {
            // Save current chat ID to localStorage with user-specific key
            localStorage.setItem(`currentChatId_${user._id}`, chat._id);
        } else if (user) {
            // Remove saved chat ID when chat is cleared
            localStorage.removeItem(`currentChatId_${user._id}`);
        }
    };

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

    // Restore saved chat when chats are loaded
    useEffect(() => {
        if (user && chats.length > 0 && !currentChat) {
            const savedChatId = localStorage.getItem(`currentChatId_${user._id}`);
            if (savedChatId) {
                const savedChatPreview = chats.find(chat => chat._id === savedChatId);
                if (savedChatPreview) {
                    console.log('Restoring saved chat:', savedChatPreview);
                    // Convert ChatPreview to Chat by adding the missing createdAt field
                    const savedChat: Chat = {
                        ...savedChatPreview,
                        createdAt: new Date(), // We'll use current date as fallback
                        lastMessage: savedChatPreview.lastMessage ? {
                            _id: '', // We don't have the message ID in preview
                            content: savedChatPreview.lastMessage.content,
                            sender: savedChatPreview.lastMessage.sender,
                            chatId: savedChatPreview._id,
                            messageType: 'text' as const,
                            createdAt: savedChatPreview.lastMessage.createdAt,
                            updatedAt: savedChatPreview.lastMessage.createdAt,
                            readBy: []
                        } : undefined
                    };
                    setCurrentChat(savedChat);
                }
            }
        }
    }, [user, chats, currentChat]);

    // Fetch current chat details
    const { isLoading: currentChatLoading } = useQuery({
        queryKey: ['chat', currentChat?._id],
        queryFn: () => apiService.getChatById(currentChat!._id),
        enabled: !!currentChat?._id,
    });

    // Fetch messages for current chat
    const {
        data: messages = [],
        isLoading: messagesLoading,
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

        const handleTyping = (data: { chatId: string; user: { _id: string }; isTyping: boolean }) => {
            if (currentChat && data.chatId === currentChat._id) {
                if (data.isTyping) {
                    setTypingUsers(prev => [...prev.filter(id => id !== data.user._id), data.user._id]);
                } else {
                    setTypingUsers(prev => prev.filter(id => id !== data.user._id));
                }
            }
        };

        const handleMessageRead = (data: { messageId: string; chatId: string; readBy: string }) => {
            if (data.readBy === user._id) {
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

        // Set up socket listeners (backend-compatible names)
        socketService.on('message', handleNewMessage);
        socketService.on('typing', handleTyping as any);
        socketService.on('messageRead', handleMessageRead);
        socketService.on('newChat', handleChatCreated);
        socketService.on('chatUpdated', handleChatUpdated);

        return () => {
            socketService.off('message');
            socketService.off('typing');
            socketService.off('messageRead');
            socketService.off('newChat');
            socketService.off('chatUpdated');
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
            // Send via socket; server will broadcast the message back
            socketService.sendMessage(currentChat._id, content, messageType);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send message');
            throw error;
        }
    };

    const createPrivateChat = async (userId: string) => {
        try {
            const chat = await apiService.createPrivateChat(userId);
            setCurrentChatWithPersistence(chat);
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
            setCurrentChatWithPersistence(chat);
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
            // Removed incorrect socket emit. Server REST currently does not broadcast read receipts.
            // Update unread count locally
            queryClient.setQueryData(['chats'], (old: ChatPreview[] = []) => {
                return old.map(chat => {
                    if (chat._id === currentChat._id) {
                        return { ...chat, unreadCount: 0 };
                    }
                    return chat;
                });
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to mark messages as read');
        }
    };

    const sendTyping = (isTyping: boolean) => {
        if (currentChat) {
            socketService.sendTyping(currentChat._id, isTyping);
        }
    };

    const loading = !user || chatsLoading || currentChatLoading || messagesLoading;

    return (
        <ChatContext.Provider
            value={{
                chats,
                currentChat,
                messages,
                typingUsers,
                setCurrentChat: setCurrentChatWithPersistence,
                sendMessage,
                createPrivateChat,
                createGroupChat,
                markAsRead,
                sendTyping,
                loading,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext; 