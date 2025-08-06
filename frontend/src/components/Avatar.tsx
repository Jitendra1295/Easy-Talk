import React from 'react';
import { cn } from '@/utils/cn';
import { User } from '@/types';

interface AvatarProps {
    user: User;
    size?: 'sm' | 'md' | 'lg';
    showStatus?: boolean;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
    user,
    size = 'md',
    showStatus = false,
    className
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
    };

    const statusClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={cn('relative inline-block', className)}>
            {user.avatar ? (
                <img
                    src={user.avatar}
                    alt={user.username || user.email || 'User'}
                    className={cn(
                        'rounded-full object-cover',
                        sizeClasses[size]
                    )}
                />
            ) : (
                <div
                    className={cn(
                        'rounded-full bg-primary-600 text-white flex items-center justify-center font-medium',
                        sizeClasses[size]
                    )}
                >
                    {getInitials(user.username || user.email?.split('@')[0] || 'User')}
                </div>
            )}

            {showStatus && (
                <div
                    className={cn(
                        'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white',
                        statusClasses[size],
                        user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    )}
                />
            )}
        </div>
    );
};

export default Avatar; 