import mongoose, { Document, Schema } from "mongoose";

export interface IProvider extends Document {
  userId: string;
  services: string[];
  customServices: string[];
  yearsExperience: number;
  businessName?: string;
  licenseNumber?: string;
  hourlyRate: number;
  bio?: string;
  location: {
    address: string;
    city: string;
    postalCode: string;
    serviceRadius: number;
  };
  rating: number;
  totalJobs: number;
  totalReviews: number;
  verified: boolean;
  isActive: boolean;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    services: [{ type: String, required: true }],
    customServices: [{ type: String }],
    yearsExperience: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    businessName: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    bio: { type: String, maxlength: 1000 },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true, index: true },
      postalCode: { type: String, required: true },
      serviceRadius: {
        type: Number,
        default: 10,
        min: 1,
        max: 100,
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    profilePhoto: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProviderSchema.index({ services: 1, "location.city": 1 });
ProviderSchema.index({ rating: -1, totalJobs: -1 });
ProviderSchema.index({ customServices: 1 });

export default mongoose.model<IProvider>("Provider", ProviderSchema);
