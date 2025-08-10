import React from 'react';

interface DateDividerProps {
    label: string;
}

const DateDivider: React.FC<DateDividerProps> = ({ label }) => {
    return (
        <div className="flex items-center justify-center my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="mx-3 text-xs text-gray-500 select-none">{label}</span>
            <div className="flex-1 h-px bg-gray-200" />
        </div>
    );
};

export default DateDivider;


