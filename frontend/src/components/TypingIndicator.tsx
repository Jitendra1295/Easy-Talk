import React from 'react';
import { cn } from '@/utils/cn';
import { User } from '@/types';
import Avatar from './Avatar';

interface TypingIndicatorProps {
    typingUsers: User[];
    className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, className }) => {
    if (typingUsers.length === 0) return null;

    return (
        <div className={cn('flex items-center gap-2 p-3 text-gray-500', className)}>
            <div className="flex -space-x-1">
                {typingUsers.slice(0, 3).map((user, index) => (
                    <Avatar
                        key={user._id}
                        user={user}
                        size="sm"
                        className={cn(index > 0 && 'ring-2 ring-white')}
                    />
                ))}
            </div>

            <div className="flex items-center gap-1">
                <span className="text-sm">
                    {typingUsers.length === 1
                        ? `${typingUsers[0].username} is typing`
                        : `${typingUsers.length} people are typing`}
                </span>

                <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                </div>
            </div>
        </div>
    );
};

export default TypingIndicator; 