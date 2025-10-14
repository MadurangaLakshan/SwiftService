import mongoose, { Document, Schema } from "mongoose";

export interface IProvider extends Document {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
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
  verified: boolean;
  isActive: boolean;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    services: [{ type: String }],
    customServices: [{ type: String }],
    yearsExperience: { type: Number, default: 0 },
    businessName: { type: String },
    licenseNumber: { type: String },
    hourlyRate: { type: Number, required: true },
    bio: { type: String },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      serviceRadius: { type: Number, default: 10 },
    },
    rating: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    profilePhoto: { type: String, default: "" },
  },
  { timestamps: true }
);

ProviderSchema.index({ userId: 1 });
ProviderSchema.index({ services: 1 });
ProviderSchema.index({ "location.city": 1 });

export default mongoose.model<IProvider>("Provider", ProviderSchema);
