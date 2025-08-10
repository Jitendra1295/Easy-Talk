import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useQuery } from '@tanstack/react-query';
import {
    LogOut,
    Search,
    Plus,
    Send,
    Paperclip,
    Users,
    UserPlus,
    MoreVertical
} from 'lucide-react';
import apiService from '@/services/api';
import Avatar from '@/components/Avatar';
import MessageBubble from '@/components/MessageBubble';
import DateDivider from '@/components/DateDivider';
import TypingIndicator from '@/components/TypingIndicator';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatChatTime } from '@/utils/date';
import { User, type Chat } from '@/types';
import UserProfileModal from '@/components/UserProfileModal';
import GroupDetailsModal from '@/components/GroupDetailsModal';
import toast from 'react-hot-toast';

const Chat: React.FC = () => {
    const { user, logout } = useAuth();
    const {
        chats,
        currentChat,
        messages,
        typingUsers,
        setCurrentChat,
        sendMessage,
        createPrivateChat,
        createGroupChat,
        markAsRead,
        sendTyping,
        loading
    } = useChat();

    console.log(chats, "chats::");
    console.log(currentChat, "currentChat::");

    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showGroupChatModal, setShowGroupChatModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
    const [showGroupDetails, setShowGroupDetails] = useState(false);

    console.log(selectedUsers, "selectedUsers::");

    // Fetch users for new chat
    const { data: users = [], error: usersError, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => apiService.getUsers(),
        enabled: showNewChatModal || showGroupChatModal,
        retry: 1
    });

    console.log(users, "users::");
    console.log(usersError, "usersError::");
    console.log(usersLoading, "usersLoading::");
    console.log(showNewChatModal, "showNewChatModal::");
    console.log(showGroupChatModal, "showGroupChatModal::");

    // Log error if it exists
    if (usersError) {
        console.error('Users query error:', usersError);
        console.error('Error details:', {
            message: usersError.message,
            status: (usersError as any).response?.status,
            data: (usersError as any).response?.data
        });
    }

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read when chat is active
    useEffect(() => {
        if (currentChat) {
            markAsRead();
        }
    }, [currentChat, messages]);

    // Typing indicator
    useEffect(() => {
        let typingTimeout: NodeJS.Timeout;

        if (isTyping) {
            sendTyping(true);
            typingTimeout = setTimeout(() => {
                setIsTyping(false);
                sendTyping(false);
            }, 1000);
        } else {
            sendTyping(false);
        }

        return () => {
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
        };
    }, [isTyping, sendTyping]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !currentChat) return;

        try {
            await sendMessage(message.trim());
            setMessage('');
            setIsTyping(false);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        if (!isTyping) {
            setIsTyping(true);
        }
    };

    const handleCreatePrivateChat = async (userId: string) => {
        try {
            await createPrivateChat(userId);
            setShowNewChatModal(false);
        } catch (error) {
            console.error('Failed to create private chat:', error);
        }
    };

    const handleCreateGroupChat = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            toast.error('Please enter a group name and select participants');
            return;
        }

        try {
            await createGroupChat(groupName.trim(), selectedUsers);
            setShowGroupChatModal(false);
            setGroupName('');
            setSelectedUsers([]);
        } catch (error) {
            console.error('Failed to create group chat:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentChat) return;

        try {
            const { url } = await apiService.uploadFile(file);
            await sendMessage(url, file.type.startsWith('image/') ? 'image' : 'file');
        } catch (error) {
            toast.error('Failed to upload file');
        }
    };

    const getChatName = (chat: any) => {
        if (chat.isGroupChat) {
            return chat.name;
        }
        const otherUser = chat.participants.find((p: User) => p._id !== user?._id);
        return otherUser?.username || 'Unknown User';
    };

    const getChatAvatar = (chat: any) => {
        if (chat.isGroupChat) {
            return null; // Group avatar
        }
        const otherUser = chat.participants.find((p: User) => p._id !== user?._id);
        return otherUser;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-white">
            {/* Sidebar */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedProfileUser(user!)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <Avatar user={user!} size="md" showStatus />
                            </button>
                            <div>
                                <h2 className="font-semibold text-gray-900">{user?.username}</h2>
                                <p className="text-sm text-gray-500">Online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowNewChatModal(true)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {chats.length > 0 ? (
                        <div className="space-y-1 p-2">
                            {chats.map((chat) => (
                                <div
                                    key={chat._id}
                                    onClick={() => {
                                        // Convert ChatPreview to Chat for compatibility
                                        const fullChat: Chat = {
                                            ...chat,
                                            createdAt: new Date(), // Fallback date
                                            lastMessage: chat.lastMessage ? {
                                                _id: '', // We don't have the message ID in preview
                                                content: chat.lastMessage.content,
                                                sender: chat.lastMessage.sender,
                                                chatId: chat._id,
                                                messageType: 'text' as const,
                                                createdAt: chat.lastMessage.createdAt,
                                                updatedAt: chat.lastMessage.createdAt,
                                                readBy: []
                                            } : undefined
                                        };
                                        setCurrentChat(fullChat);
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${currentChat?._id === chat._id
                                        ? 'bg-primary-50 border border-primary-200'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    <Avatar
                                        user={getChatAvatar(chat) || user!}
                                        size="md"
                                        showStatus
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {getChatName(chat)}
                                            </h3>
                                            {chat.lastMessage && (
                                                <span className="text-xs text-gray-500 flex-shrink-0">
                                                    {formatChatTime(chat.lastMessage.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {chat.lastMessage && (
                                            <p className="text-sm text-gray-600 truncate">
                                                {chat.lastMessage.sender.username === user?.username
                                                    ? '->'
                                                    : "<-"
                                                }
                                                {chat.lastMessage.content}
                                            </p>
                                        )}
                                        {chat.unreadCount > 0 && (
                                            <div className="flex items-center justify-between mt-1">
                                                <div></div>
                                                <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                                    {chat.unreadCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <div className="text-center p-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Chat History</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Start a new conversation by clicking the buttons below
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Chat Buttons */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowNewChatModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <UserPlus className="w-4 h-4" />
                            New Chat
                        </button>
                        <button
                            onClick={() => setShowGroupChatModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Users className="w-4 h-4" />
                            New Group
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {currentChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar user={getChatAvatar(currentChat) || user!} size="md" showStatus />
                                    <div>
                                        <h2 className="font-semibold text-gray-900">{getChatName(currentChat)}</h2>
                                        <p className="text-sm text-gray-500">
                                            {currentChat.isGroupChat
                                                ? `${currentChat.participants.length} members`
                                                : 'Online'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => currentChat?.isGroupChat ? setShowGroupDetails(true) : setSelectedProfileUser((getChatAvatar(currentChat) || user!) as User)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages (chronological, newest at bottom) */}
                        <div className="flex-1 overflow-y-auto py-4 px-0 space-y-1">
                            {(() => {
                                const sorted = [...messages].sort(
                                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                                );
                                return sorted.map((msg, index) => {
                                    const prev = sorted[index - 1];
                                    const next = sorted[index + 1];
                                    const msgDate = new Date(msg.createdAt);
                                    const currDate = msgDate.toDateString();
                                    const prevDate = prev ? new Date(prev.createdAt).toDateString() : null;
                                    const showDateDivider = !prev || currDate !== prevDate;

                                    const sameSenderAsPrev = !!prev && prev.sender._id === msg.sender._id;
                                    const sameSenderAsNext = !!next && next.sender._id === msg.sender._id;
                                    const isFirstInGroup = !sameSenderAsPrev;
                                    const isLastInGroup = !sameSenderAsNext;

                                    const label = (() => {
                                        const today = new Date();
                                        const yesterday = new Date();
                                        yesterday.setDate(today.getDate() - 1);
                                        if (currDate === today.toDateString()) return 'Today';
                                        if (currDate === yesterday.toDateString()) return 'Yesterday';
                                        return msgDate.toLocaleDateString();
                                    })();

                                    return (
                                        <React.Fragment key={msg._id}>
                                            {showDateDivider && <DateDivider label={label} />}
                                            <MessageBubble
                                                message={msg}
                                                currentUser={user!}
                                                isLastMessage={index === sorted.length - 1}
                                                showAvatar={isLastInGroup}
                                                showUsername={isFirstInGroup}
                                                isFirstInGroup={isFirstInGroup}
                                                isLastInGroup={isLastInGroup}
                                            />
                                        </React.Fragment>
                                    );
                                });
                            })()}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Typing Indicator */}
                        <TypingIndicator typingUsers={typingUsers as any} />

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                                    <Paperclip className="w-5 h-5" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        accept="image/*,.pdf,.doc,.docx,.txt"
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={handleMessageChange}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim()}
                                    className="p-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    /* Welcome Screen */
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Chat App</h2>
                            <p className="text-gray-500 mb-6">Select a chat to start messaging</p>
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={() => setShowNewChatModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Start New Chat
                                </button>
                                <button
                                    onClick={() => setShowGroupChatModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <Users className="w-4 h-4" />
                                    Create Group
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Start a new chat</h3>
                        {usersLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <LoadingSpinner size="md" />
                                <span className="ml-2 text-gray-600">Loading users...</span>
                            </div>
                        ) : usersError ? (
                            <div className="text-center py-8 text-red-600">
                                Failed to load users. Please try again.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {users
                                    .filter(u => u._id !== user?._id)
                                    .map((user) => (
                                        <div
                                            key={user._id}
                                            onClick={() => handleCreatePrivateChat(user._id)}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                        >
                                            <Avatar user={user} size="md" showStatus />
                                            <div>
                                                <p className="font-medium">{user.username}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                        <button
                            onClick={() => setShowNewChatModal(false)}
                            className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* New Group Chat Modal */}
            {showGroupChatModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Create a group chat</h3>
                        <input
                            type="text"
                            placeholder="Group name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="space-y-2 mb-4">
                            {users
                                .filter(u => u._id !== user?._id)
                                .map((user) => (
                                    <label key={user._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedUsers([...selectedUsers, user._id]);
                                                } else {
                                                    setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                                }
                                            }}
                                            className="rounded"
                                        />
                                        <Avatar user={user} size="sm" />
                                        <div>
                                            <p className="font-medium">{user.username}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </label>
                                ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateGroupChat}
                                disabled={!groupName.trim() || selectedUsers.length === 0}
                                className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                                Create Group
                            </button>
                            <button
                                onClick={() => {
                                    setShowGroupChatModal(false);
                                    setGroupName('');
                                    setSelectedUsers([]);
                                }}
                                className="flex-1 py-2 px-4 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedProfileUser && (
                <UserProfileModal
                    user={selectedProfileUser}
                    onClose={() => setSelectedProfileUser(null)}
                />
            )}

            {showGroupDetails && currentChat?.isGroupChat && (
                <GroupDetailsModal
                    chat={currentChat}
                    onClose={() => setShowGroupDetails(false)}
                />
            )}
        </div>
    );
};

export default Chat; 