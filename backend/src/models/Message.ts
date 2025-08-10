import mongoose, { Schema, Types } from 'mongoose';
// import { IMessage } from '../types';

interface IMessage {
    _id: string;
    sender: Types.ObjectId;
    content: string;
    messageType: 'text' | 'image' | 'file';
    chatId: Types.ObjectId;
    readBy: Types.ObjectId[];
    deliveredTo: Types.ObjectId[];
    parentMessageId: Types.ObjectId | null;
    threadRootId: Types.ObjectId | null;
    forwardedFrom: {
        userId: Types.ObjectId;
        chatId: Types.ObjectId;
        messageId: Types.ObjectId;
        at: Date;
    } | null;
    reactions: Map<string, Types.ObjectId[]>;
    editedAt: Date | null;
    deletedAt: Date | null;
    deletedBy: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
    save(): Promise<this>
}

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
        type: Types.ObjectId,
        ref: 'User'
    }],
    deliveredTo: [{
        type: Types.ObjectId,
        ref: 'User'
    }],
    parentMessageId: {
        type: Types.ObjectId,
        ref: 'Message',
        default: null
    },
    threadRootId: {
        type: Types.ObjectId,
        ref: 'Message',
        default: null
    },
    forwardedFrom: {
        userId: { type: Types.ObjectId, ref: 'User' },
        chatId: { type: Types.ObjectId, ref: 'Chat' },
        messageId: { type: Types.ObjectId, ref: 'Message' },
        at: { type: Date }
    },
    reactions: {
        type: Map<string, Types.ObjectId[]>, // emoji -> userIds
        default: {}
    },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Types.ObjectId, ref: 'User', default: null }
}, {
    timestamps: true
});

// Indexes for better query performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ readBy: 1 });
messageSchema.index({ threadRootId: 1 });

// Virtual for message response
messageSchema.virtual('toResponse').get(function (this: IMessage) {
    return {
        _id: this._id,
        sender: this.sender,
        content: this.content,
        messageType: this.messageType,
        chatId: this.chatId,
        readBy: this.readBy,
        deliveredTo: this.deliveredTo,
        parentMessageId: this.parentMessageId,
        threadRootId: this.threadRootId,
        forwardedFrom: this.forwardedFrom,
        reactions: Object.fromEntries(this.reactions || []),
        editedAt: this.editedAt,
        deletedAt: this.deletedAt,
        deletedBy: this.deletedBy,
        createdAt: this.createdAt
    };
});

// Method to mark as read
messageSchema.methods.markAsRead = async function (this: IMessage, userId: string) {
    if (!this.readBy.includes(new Types.ObjectId(userId))) {
        this.readBy.push(new Types.ObjectId(userId));
        return this.save();
    }
    return this;
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function (this: IMessage, userId: string): boolean {
    return this.readBy.some(id => id.toString() === userId);
};

// Static method to get messages for a chat with pagination
messageSchema.statics.getMessagesForChat = async function (
    this: typeof Message,
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
messageSchema.statics.getUnreadCount = async function (
    this: typeof Message,
    chatId: string,
    userId: string
) {
    return this.countDocuments({
        chatId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
    });
};

export const Message = mongoose.model<IMessage>('Message', messageSchema);