import React from 'react';
import Avatar from '@/components/Avatar';
import { Chat, User } from '@/types';

interface GroupDetailsModalProps {
  chat: Chat;
  onClose: () => void;
}

const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ chat, onClose }) => {
  const members: User[] = chat.participants || [] as any;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal>
      <div className="bg-white rounded-xl p-6 w-[560px] max-w-[95vw] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Group Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="mb-4">
          <div className="text-base font-semibold text-gray-900">{chat.name || 'Group'}</div>
          <div className="text-sm text-gray-500">{members.length} members</div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto divide-y rounded-lg border">
          {members.map((u) => (
            <div key={u._id} className="flex items-center gap-3 p-3">
              <Avatar user={u} size="md" showStatus />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{u.username}</div>
                <div className="text-sm text-gray-500 truncate">{u.email}</div>
              </div>
              {u.isOnline && <span className="text-xs text-green-600">online</span>}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800">Close</button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal;


