import mongoose, { Schema } from 'mongoose';
import { IChat } from '../types';

const chatSchema = new Schema<IChat>({
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  name: {
    type: String,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  avatar: {
    type: String,
    default: null
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1 });
chatSchema.index({ 'unreadCount.$*': 1 });

// Virtual for chat response
chatSchema.virtual('toResponse').get(function () {
  return {
    _id: this._id,
    type: this.type,
    participants: this.participants,
    name: this.name,
    description: this.description,
    avatar: this.avatar,
    admin: this.admin,
    lastMessage: this.lastMessage,
    unreadCount: this.unreadCount,
    createdAt: this.createdAt
  };
});

// Method to add participant
chatSchema.methods.addParticipant = async function (userId: string) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    return this.save();
  }
  return this;
};

// Method to remove participant
chatSchema.methods.removeParticipant = async function (userId: string) {
  this.participants = this.participants.filter((id: any) => id.toString() !== userId);
  return this.save();
};

// Method to update unread count
chatSchema.methods.updateUnreadCount = async function (userId: string, count: number) {
  this.unreadCount.set(userId, count);
  return this.save();
};

// Method to reset unread count
chatSchema.methods.resetUnreadCount = async function (userId: string) {
  this.unreadCount.set(userId, 0);
  return this.save();
};

// Static method to find or create private chat
chatSchema.statics.findOrCreatePrivateChat = async function (userId1: string, userId2: string) {
  let chat = await this.findOne({
    type: 'private',
    participants: { $all: [userId1, userId2], $size: 2 }
  });
  if (!chat) {
    chat = await this.create({
      type: 'private',
      participants: [userId1, userId2]
    });
  }
  return chat;
};

export const Chat = mongoose.model<IChat>('Chat', chatSchema); 