import mongoose, { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  location: {
    address: string;
    city: string;
    postalCode: string;
  };
  propertyType: "house" | "apartment" | "condo" | "commercial";
  profilePhoto?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    propertyType: {
      type: String,
      enum: ["house", "apartment", "condo", "commercial"],
      required: true,
    },
    profilePhoto: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
CustomerSchema.index({ userId: 1 });
CustomerSchema.index({ "location.city": 1 });

export default mongoose.model<ICustomer>("Customer", CustomerSchema);
