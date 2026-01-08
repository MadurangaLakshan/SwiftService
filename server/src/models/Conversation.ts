import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
  participantIds: string[];
  lastMessage: string | null;
  lastMessageTime: Date;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
  getOtherParticipantId(userId: string): string | null;
  incrementUnreadCount(userId: string): void;
  resetUnreadCount(userId: string): void;
}

const ConversationSchema: Schema = new Schema(
  {
    participantIds: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length === 2;
        },
        message: "Conversation must have exactly 2 participants",
      },
    },

    lastMessage: {
      type: String,
      default: null,
      maxlength: 500,
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient conversation queries
ConversationSchema.index({ participantIds: 1, lastMessageTime: -1 });
ConversationSchema.index({ participantIds: 1 });
ConversationSchema.index({ lastMessageTime: -1 });

// Method to get other participant's ID
ConversationSchema.methods.getOtherParticipantId = function (
  userId: string
): string | null {
  return this.participantIds.find((id: string) => id !== userId) || null;
};

// Method to increment unread count for a user
ConversationSchema.methods.incrementUnreadCount = function (
  userId: string
): void {
  const currentCount = this.unreadCount.get(userId) || 0;
  this.unreadCount.set(userId, currentCount + 1);
};

// Method to reset unread count for a user
ConversationSchema.methods.resetUnreadCount = function (userId: string): void {
  this.unreadCount.set(userId, 0);
};

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);
