import React from 'react';
import Avatar from '@/components/Avatar';
import { User } from '@/types';

interface UserProfileModalProps {
    user: User;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal>
            <div className="bg-white rounded-xl p-6 w-[420px] max-w-[92vw] shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">User Profile</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <Avatar user={user} size="lg" showStatus />
                    <div>
                        <div className="text-base font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                    <div><span className="font-medium text-gray-700">Status: </span>{user.isOnline ? 'Online' : 'Offline'}</div>
                    {user.lastSeen && (
                        <div><span className="font-medium text-gray-700">Last seen: </span>{new Date(user.lastSeen).toLocaleString()}</div>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800">Close</button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;


