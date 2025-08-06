import React from 'react';
import { cn } from '@/utils/cn';
import { formatMessageTime } from '@/utils/date';
import { Message, User } from '@/types';
import Avatar from './Avatar';

interface MessageBubbleProps {
    message: Message;
    currentUser: User;
    isLastMessage?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    currentUser,
    isLastMessage = false
}) => {
    const isOwnMessage = message.sender._id === currentUser._id;

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
                return <p className="whitespace-pre-wrap">{message.content}</p>;
        }
    };

    return (
        <div
            className={cn(
                'flex gap-2 mb-4 group',
                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
            )}
        >
            {!isOwnMessage && (
                <Avatar user={message.sender} size="sm" showStatus />
            )}

            <div className={cn('flex flex-col', isOwnMessage ? 'items-end' : 'items-start')}>
                {!isOwnMessage && (
                    <span className="text-xs text-gray-500 mb-1 ml-1">
                        {message.sender.username}
                    </span>
                )}

                <div
                    className={cn(
                        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words',
                        isOwnMessage
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                    )}
                >
                    {renderMessageContent()}
                </div>

                <div
                    className={cn(
                        'flex items-center gap-1 mt-1 text-xs text-gray-500',
                        isOwnMessage ? 'justify-end' : 'justify-start'
                    )}
                >
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isOwnMessage && (
                        <div className="flex items-center">
                            {message.readBy.length > 1 ? (
                                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                </svg>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble; 