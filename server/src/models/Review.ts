import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number;
  review?: string;
  serviceType: string;
  customerName: string;
  customerPhoto?: string;
  providerResponse?: {
    message: string;
    respondedAt: Date;
  };
  isVerified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhoto: {
      type: String,
    },
    providerResponse: {
      message: { type: String, maxlength: 500 },
      respondedAt: { type: Date },
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    helpful: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ providerId: 1, rating: -1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ customerId: 1, providerId: 1 });

export default mongoose.model<IReview>("Review", ReviewSchema);
