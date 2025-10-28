import mongoose, { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
  userId: string;
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
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true, index: true },
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CustomerSchema.index({ "location.city": 1 });

export default mongoose.model<ICustomer>("Customer", CustomerSchema);
