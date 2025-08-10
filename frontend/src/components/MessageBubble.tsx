import React from 'react';
import { cn } from '@/utils/cn';
import { formatMessageTime } from '@/utils/date';
import { Message, User } from '@/types';
import Avatar from './Avatar';

interface MessageBubbleProps {
    message: Message;
    currentUser: User;
    isLastMessage?: boolean;
    showAvatar?: boolean;
    showUsername?: boolean;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    currentUser,
    isLastMessage = false,
    showAvatar = false,
    showUsername = false,
    isFirstInGroup = false,
    isLastInGroup = false,
}) => {
    const senderId = typeof (message as any).sender === 'string'
        ? (message as any).sender
        : message.sender._id;
    const isOwnMessage = senderId === currentUser._id;

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
                'flex items-end gap-2 mx-3', // base flex row
                isOwnMessage ? 'justify-end' : 'justify-start'
            )}
        >
            {/* Avatar only for other users */}
            {!isOwnMessage && showAvatar && (
                <Avatar user={message.sender} size="sm" showStatus />
            )}

            <div
                className={cn(
                    'relative max-w-xs lg:max-w-md px-3 py-2 pr-10 rounded-lg break-words', // <-- pr-10 gives space for time
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
                {renderMessageContent()}

                {/* Timestamp */}
                <span className="absolute bottom-1 right-2 text-[10px] opacity-70">
                    {formatMessageTime(message.createdAt)}
                </span>
            </div>


        </div>
    );
};

export default MessageBubble; 