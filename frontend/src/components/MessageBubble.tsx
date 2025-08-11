import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { formatMessageTime } from '@/utils/date';
import { Message, User } from '@/types';
import Avatar from './Avatar';
import { useChat } from '@/contexts/ChatContext';
import { MoreVertical, Smile, CornerUpRight } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
    currentUser: User;
    isLastMessage?: boolean;
    showAvatar?: boolean;
    showUsername?: boolean;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
    onReply?: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    currentUser,
    isLastMessage: _isLastMessage = false,
    showAvatar = false,
    showUsername: _showUsername = false,
    isFirstInGroup = false,
    isLastInGroup = false,
    onReply,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const pickerRef = useRef<HTMLDivElement | null>(null);
    const senderId = typeof (message as any).sender === 'string'
        ? (message as any).sender
        : message.sender._id;
    const isOwnMessage = senderId === currentUser._id;

    const { reactToMessage, editMessage, deleteMessage } = useChat();

    const reactions = (message as any).reactions as Record<string, string[]> | undefined;
    const isDeleted = (message as any).deletedAt;
    const isEdited = !!(message as any).editedAt;
    const reactionOptions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    const renderMessageContent = () => {
        switch (message.messageType) {
            case 'image':
                return (
                    <img
                        src={message.content}
                        alt="Image"
                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.content, '_blank')}
                    />
                );
            case 'file':
                return (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                        <div className="text-blue-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-700 truncate">{message.content}</span>
                    </div>
                );
            default:
                return <p className="whitespace-pre-wrap">{isDeleted ? 'Message deleted' : message.content}</p>;
        }
    };

    // Close menu/picker on outside click or Esc
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const t = e.target as Node;
            if (menuOpen && menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
            if (showPicker && pickerRef.current && !pickerRef.current.contains(t)) setShowPicker(false);
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuOpen(false);
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [menuOpen, showPicker]);

    return (
        <div className="flex items-start px-3">
            {/* Fixed avatar space */}
            <div className="w-8 flex-shrink-0">
                {!isOwnMessage && showAvatar && (
                    <Avatar user={message.sender} size="sm" showStatus />
                )}
            </div>

            <div
                className={cn(
                    'relative max-w-xs lg:max-w-md px-3 py-2 pr-10 rounded-lg break-words',
                    isOwnMessage
                        ? cn(
                            'bg-primary-600 text-white ml-auto',
                            isFirstInGroup ? 'rounded-br-none' : '',
                            isLastInGroup ? 'rounded-tr-none' : ''
                        )
                        : cn(
                            'bg-gray-200 text-gray-900 mr-auto',
                            isFirstInGroup ? 'rounded-bl-none' : '',
                            isLastInGroup ? 'rounded-tl-none' : ''
                        )
                )}
            >
                <div className="flex flex-col">
                    <div className="whitespace-pre-wrap">{renderMessageContent()}</div>
                    <div className="flex items-center justify-end gap-2 mt-1">
                        {isEdited && !isDeleted && (
                            <span className="text-[10px] opacity-70">edited</span>
                        )}
                        <span className="text-[10px] opacity-70">
                            {formatMessageTime(message.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Reaction pills positioned near the bubble and visible on hover */}
                {!!reactions && Object.keys(reactions).length > 0 && (
                    <div
                        className={
                            cn(
                                'absolute -bottom-6 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity',
                                isOwnMessage ? 'right-0 justify-end' : 'left-0 justify-start'
                            )
                        }
                    >
                        {Object.entries(reactions).map(([emoji, users]) => (
                            <button
                                key={emoji}
                                className="px-2 py-0.5 text-xs rounded-full bg-gray-100 hover:bg-gray-200"
                                onClick={() => { if (!isOwnMessage) reactToMessage(message._id, emoji); }}
                                title={`${users.length}`}
                            >
                                {emoji} {users.length}
                            </button>
                        ))}
                    </div>
                )}

                {/* Hover toolbar: emoji chip + reply icon for received messages */}
                {!isOwnMessage && !isDeleted && (
                    <div
                        className={cn(
                            'absolute -top-7 flex items-center gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity',
                            isOwnMessage ? 'right-0' : 'left-0'
                        )}
                    >
                        <div className="relative">
                            <button
                                className="flex items-center gap-1 rounded-full bg-white border px-2 py-0.5 shadow text-xs hover:bg-gray-50"
                                onClick={() => setShowPicker((v) => !v)}
                                aria-label="React"
                            >
                                <Smile className="w-3.5 h-3.5" /> React
                            </button>
                            {showPicker && (
                                <div className="absolute z-10 mt-1 flex gap-1 rounded-lg border bg-white shadow p-1" ref={pickerRef}>
                                    {reactionOptions.map((emo) => (
                                        <button
                                            key={emo}
                                            className="px-2 py-0.5 text-sm rounded hover:bg-gray-50"
                                            onClick={() => { reactToMessage(message._id, emo); setShowPicker(false); }}
                                        >
                                            {emo}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            className="p-1 rounded-full bg-white border shadow hover:bg-gray-50"
                            aria-label="Reply"
                            onClick={() => onReply?.(message)}
                        >
                            <CornerUpRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Overflow menu trigger (on hover) */}
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-gray-500"
                aria-label="Message menu"
                onClick={() => setMenuOpen((v) => !v)}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
                <div
                    className={cn(
                        'absolute z-10 mt-6 min-w-[140px] rounded-lg border bg-white shadow-lg text-sm',
                        isOwnMessage ? 'right-6' : 'left-6'
                    )}
                    ref={menuRef}
                >
                    {!isOwnMessage ? (
                        <div className="py-1">
                            <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { onReply?.(message); setMenuOpen(false); }}>Reply</button>
                        </div>
                    ) : (
                        <div className="py-1">
                            <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { const content = prompt('Edit message', message.content); if (content !== null && content.trim()) { editMessage(message._id, content.trim()); } setMenuOpen(false); }}>Edit</button>
                            <button className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50" onClick={() => { deleteMessage(message._id); setMenuOpen(false); }}>Delete</button>
                        </div>
                    )}
                </div>
            )}
            {/* (moved reaction pills inside bubble for anchored positioning) */}

        </div>
    );
};

export default MessageBubble; 