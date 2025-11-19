import mongoose, { Document, Schema } from "mongoose";

// Message Interface
export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  text: string;
  timestamp: Date;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Message Schema
const MessageSchema: Schema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderPhoto: {
      type: String,
      default: null,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient message retrieval
MessageSchema.index({ conversationId: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1, timestamp: -1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);

// Conversation Interface
export interface IConversation extends Document {
  participantIds: string[];
  participants: Map<
    string,
    {
      name: string;
      photo: string | null;
      userType: "provider" | "customer";
    }
  >;
  lastMessage: string | null;
  lastMessageTime: Date;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation Schema
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
    participants: {
      type: Map,
      of: new Schema(
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          photo: {
            type: String,
            default: null,
          },
          userType: {
            type: String,
            enum: ["provider", "customer"],
            required: true,
          },
        },
        { _id: false }
      ),
      required: true,
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
