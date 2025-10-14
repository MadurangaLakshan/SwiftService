import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  userId: string;
  email: string;
  userType: "provider" | "customer";
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    userType: {
      type: String,
      enum: ["provider", "customer"],
      required: true,
    },
  },
  { timestamps: true }
);

UserSchema.index({ userId: 1 });
UserSchema.index({ email: 1 });

export default mongoose.model<IUser>("User", UserSchema);
