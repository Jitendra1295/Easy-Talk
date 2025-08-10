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
    sendMessage: (content: string, messageType?: 'text' | 'image' | 'file', options?: { parentMessageId?: string | null; threadRootId?: string | null; forwardedFrom?: { userId: string; chatId: string; messageId: string } | null }) => Promise<void>;
    reactToMessage: (messageId: string, emoji: string) => void;
    editMessage: (messageId: string, content: string) => void;
    deleteMessage: (messageId: string) => void;
    forwardMessage: (targetChatId: string, message: Message) => void;
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
        queryFn: () => apiService.getChats(),
        enabled: !!user,
    });


    useEffect(() => {
        if (user) {
            refetchChats();
        }
    }, [user, refetchChats]);

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
    const {
        data: currentChatData,
        isLoading: currentChatLoading,
    } = useQuery({
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

    // Socket event handlers
    useEffect(() => {
        if (!user) return;

        const handleNewMessage = (message: Message) => {
            // Update messages in current chat
            if (currentChat && message.chatId === currentChat._id) {
                queryClient.setQueryData(['messages', currentChat._id], (old: Message[] = []) => {
                    // Remove matching optimistic temp message to avoid duplicates
                    const filtered = old.filter((m: any) => {
                        const isTemp = typeof m._id === 'string' && m._id.startsWith('temp-');
                        const sameSender = (m as any).sender?._id === (message as any).sender?._id;
                        const sameContent = m.content === message.content;
                        return !(isTemp && sameSender && sameContent);
                    });
                    return [message, ...filtered];
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

        const handleTyping = (data: { chatId: string; user: any; isTyping: boolean }) => {
            if (currentChat && data.chatId === currentChat._id) {
                const userId = data.user._id;
                if (data.isTyping) {
                    setTypingUsers(prev => [...prev.filter(id => id !== userId), userId]);
                } else {
                    setTypingUsers(prev => prev.filter(id => id !== userId));
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

        const handleReactionUpdated = (data: { messageId: string; chatId: string; emoji: string; userId: string; action: 'add' | 'remove'; reactions: Record<string, string[]> }) => {
            if (!currentChat || data.chatId !== currentChat._id) return;
            queryClient.setQueryData(['messages', currentChat._id], (old: any[] = []) => {
                return old.map((m: any) => (m._id === data.messageId ? { ...m, reactions: data.reactions } : m));
            });
        };

        const handleMessageUpdated = (updated: any) => {
            if (!currentChat || updated.chatId !== currentChat._id) return;
            queryClient.setQueryData(['messages', currentChat._id], (old: any[] = []) => {
                return old.map((m: any) => (m._id === updated._id ? { ...m, ...updated } : m));
            });
        };

        const handleMessageDeleted = (data: { messageId: string; chatId: string; deletedBy: string }) => {
            if (!currentChat || data.chatId !== currentChat._id) return;
            queryClient.setQueryData(['messages', currentChat._id], (old: any[] = []) => {
                return old.map((m: any) => (m._id === data.messageId ? { ...m, deletedAt: new Date().toISOString(), deletedBy: data.deletedBy, content: 'Message deleted' } : m));
            });
        };

        // Set up socket listeners via raw socket instance
        const sock = socketService.getSocket();
        sock?.on('message', handleNewMessage as any);
        sock?.on('typing', handleTyping as any);
        sock?.on('messageRead', handleMessageRead as any);
        sock?.on('newChat', handleChatCreated as any);
        sock?.on('chatUpdated', handleChatUpdated as any);
        sock?.on('reactionUpdated', handleReactionUpdated as any);
        sock?.on('messageUpdated', handleMessageUpdated as any);
        sock?.on('messageDeleted', handleMessageDeleted as any);

        return () => {
            sock?.off('message', handleNewMessage as any);
            sock?.off('typing', handleTyping as any);
            sock?.off('messageRead', handleMessageRead as any);
            sock?.off('newChat', handleChatCreated as any);
            sock?.off('chatUpdated', handleChatUpdated as any);
            sock?.off('reactionUpdated', handleReactionUpdated as any);
            sock?.off('messageUpdated', handleMessageUpdated as any);
            sock?.off('messageDeleted', handleMessageDeleted as any);
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

    const sendMessage = async (
        content: string,
        messageType: 'text' | 'image' | 'file' = 'text',
        options?: { parentMessageId?: string | null; threadRootId?: string | null; forwardedFrom?: { userId: string; chatId: string; messageId: string } | null }
    ) => {
        if (!currentChat) return;

        try {
            // Emit via socket for immediate broadcast
            socketService.sendMessage(currentChat._id, content, messageType, options);

            // Optimistic UI update (will be deduped when server message arrives)
            const optimisticMessage: Message = {
                _id: `temp-${Date.now()}`,
                content,
                sender: user!,
                chatId: currentChat._id,
                messageType,
                createdAt: new Date(),
                updatedAt: new Date(),
                readBy: [user!._id],
            } as any;

            queryClient.setQueryData(['messages', currentChat._id], (old: Message[] = []) => [optimisticMessage, ...old]);

            queryClient.setQueryData(['chats'], (old: ChatPreview[] = []) => {
                return old.map(chat => {
                    if (chat._id === currentChat._id) {
                        return {
                            ...chat,
                            lastMessage: {
                                content: optimisticMessage.content,
                                sender: optimisticMessage.sender,
                                createdAt: optimisticMessage.createdAt,
                            },
                            updatedAt: optimisticMessage.createdAt,
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

    const reactToMessage = (messageId: string, emoji: string) => {
        if (!currentChat) return;
        // Optimistic toggle
        queryClient.setQueryData(['messages', currentChat._id], (old: any[] = []) => {
            return old.map((m: any) => {
                if (m._id !== messageId) return m;
                const reactions: Record<string, string[]> = { ...(m.reactions || {}) };
                const list = reactions[emoji] || [];
                const has = list.includes(user!._id);
                reactions[emoji] = has ? list.filter(id => id !== user!._id) : [...list, user!._id];
                return { ...m, reactions };
            });
        });
        socketService.reactMessage(messageId, currentChat._id, emoji);
    };

    const editMessage = (messageId: string, content: string) => {
        if (!currentChat) return;
        socketService.editMessage(messageId, currentChat._id, content);
    };

    const deleteMessage = (messageId: string) => {
        if (!currentChat) return;
        socketService.deleteMessage(messageId, currentChat._id);
    };

    const forwardMessage = (targetChatId: string, message: Message) => {
        if (!targetChatId) return;
        const payload = {
            parentMessageId: null,
            threadRootId: null,
            forwardedFrom: { userId: (message as any).sender?._id || (message as any).sender, chatId: message.chatId, messageId: message._id },
        };
        socketService.sendMessage(targetChatId, message.content, message.messageType, payload as any);
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
        setCurrentChat: setCurrentChatWithPersistence,
        sendMessage,
        reactToMessage,
        editMessage,
        deleteMessage,
        forwardMessage,
        createPrivateChat,
        createGroupChat,
        markAsRead,
        sendTyping,
        loading: chatsLoading || currentChatLoading || messagesLoading,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}; 