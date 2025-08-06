import mongoose, { Schema } from 'mongoose';
import { IMessage } from '../types';

const messageSchema = new Schema<IMessage>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    readBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ readBy: 1 });

// Virtual for message response
messageSchema.virtual('toResponse').get(function () {
    return {
        _id: this._id,
        sender: this.sender,
        content: this.content,
        messageType: this.messageType,
        chatId: this.chatId,
        readBy: this.readBy,
        createdAt: this.createdAt
    };
});

// Method to mark as read
messageSchema.methods.markAsRead = async function (userId: string) {
    if (!this.readBy.includes(userId)) {
        this.readBy.push(userId);
        return this.save();
    }
    return this;
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function (userId: string): boolean {
    return this.readBy.some(id => id.toString() === userId);
};

// Static method to get messages for a chat with pagination
messageSchema.statics.getMessagesForChat = async function (
    chatId: string,
    page: number = 1,
    limit: number = 50
) {
    const skip = (page - 1) * limit;

    const messages = await this.find({ chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username email avatar')
        .populate('readBy', 'username email avatar')
        .lean();

    const total = await this.countDocuments({ chatId });

    return {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// Static method to get unread message count for a user in a chat
messageSchema.statics.getUnreadCount = async function (chatId: string, userId: string) {
    return this.countDocuments({
        chatId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
    });
};

export const Message = mongoose.model<IMessage>('Message', messageSchema); 