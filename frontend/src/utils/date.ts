import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function formatMessageTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isToday(dateObj)) {
        return format(dateObj, 'HH:mm');
    } else if (isYesterday(dateObj)) {
        return 'Yesterday';
    } else {
        return format(dateObj, 'MMM dd');
    }
}

export function formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatChatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isToday(dateObj)) {
        return format(dateObj, 'HH:mm');
    } else if (isYesterday(dateObj)) {
        return 'Yesterday';
    } else {
        return format(dateObj, 'MMM dd');
    }
} 