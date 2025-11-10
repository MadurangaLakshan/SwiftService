import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  customerId: string;
  providerId: string;
  serviceType: string;
  category: string;
  scheduledDate: Date;
  timeSlot: string;
  serviceAddress: string;
  additionalNotes?: string;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  pricing: {
    hourlyRate: number;
    estimatedHours: number;
    platformFee: number;
    totalAmount: number;
  };
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
  providerDetails: {
    name: string;
    phone: string;
    email: string;
    profilePhoto?: string;
  };
  cancellationReason?: string;
  cancelledBy?: "customer" | "provider";
  cancelledAt?: Date;
  completedAt?: Date;
  rating?: number;
  review?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    providerId: {
      type: String,
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    serviceAddress: {
      type: String,
      required: true,
    },
    additionalNotes: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    pricing: {
      hourlyRate: {
        type: Number,
        required: true,
      },
      estimatedHours: {
        type: Number,
        default: 1,
      },
      platformFee: {
        type: Number,
        default: 5,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
    },
    customerDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    providerDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      profilePhoto: { type: String },
    },
    cancellationReason: { type: String },
    cancelledBy: {
      type: String,
      enum: ["customer", "provider"],
    },
    cancelledAt: { type: Date },
    completedAt: { type: Date },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 1000,
    },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
BookingSchema.index({ customerId: 1, status: 1 });
BookingSchema.index({ providerId: 1, status: 1 });
BookingSchema.index({ scheduledDate: 1, status: 1 });

export default mongoose.model<IBooking>("Booking", BookingSchema);
