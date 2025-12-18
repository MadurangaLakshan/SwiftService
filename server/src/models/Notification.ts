import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: "booking" | "message" | "service" | "payment" | "review" | "general";
  relatedId?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["booking", "message", "service", "payment", "review", "general"],
      required: true,
    },
    relatedId: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
