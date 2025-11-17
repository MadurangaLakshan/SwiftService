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
  status:
    | "pending"
    | "confirmed"
    | "on-the-way"
    | "arrived"
    | "in-progress"
    | "awaiting-customer-approval"
    | "completed"
    | "disputed"
    | "cancelled";
  pricing: {
    hourlyRate: number;
    estimatedHours: number;
    actualHours?: number;
    platformFee: number;
    totalAmount: number;
    finalAmount?: number;
  };
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    image?: string;
  };
  providerDetails: {
    name: string;
    phone: string;
    email: string;
    profilePhoto?: string;
  };
  timeline: {
    bookedAt: Date;
    confirmedAt?: Date;
    startedTravelAt?: Date;
    arrivedAt?: Date;
    workStartedAt?: Date;
    workCompletedAt?: Date;
    customerApprovedAt?: Date;
  };
  workDocumentation?: {
    beforePhotos: string[];
    afterPhotos: string[];
    workNotes?: string;
  };
  cancellationReason?: string;
  cancelledBy?: "customer" | "provider";
  cancelledAt?: Date;
  completedAt?: Date;
  rating?: number;
  review?: string;
  reviewedAt?: Date;
  dispute?: {
    reason: string;
    description: string;
    raisedBy: "customer" | "provider";
    raisedAt: Date;
    status: "open" | "resolved" | "escalated";
    resolution?: string;
    resolvedAt?: Date;
  };
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
      enum: [
        "pending",
        "confirmed",
        "on-the-way",
        "arrived",
        "in-progress",
        "awaiting-customer-approval",
        "completed",
        "disputed",
        "cancelled",
      ],
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
      actualHours: {
        type: Number,
      },
      platformFee: {
        type: Number,
        default: 5,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      finalAmount: {
        type: Number,
      },
    },
    customerDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      image: { type: String },
    },
    providerDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      profilePhoto: { type: String },
    },
    timeline: {
      bookedAt: { type: Date, required: true },
      confirmedAt: { type: Date },
      startedTravelAt: { type: Date },
      arrivedAt: { type: Date },
      workStartedAt: { type: Date },
      workCompletedAt: { type: Date },
      customerApprovedAt: { type: Date },
    },
    workDocumentation: {
      beforePhotos: [{ type: String }],
      afterPhotos: [{ type: String }],
      workNotes: { type: String, maxlength: 1000 },
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
    dispute: {
      reason: { type: String },
      description: { type: String },
      raisedBy: {
        type: String,
        enum: ["customer", "provider"],
      },
      raisedAt: { type: Date },
      status: {
        type: String,
        enum: ["open", "resolved", "escalated"],
        default: "open",
      },
      resolution: { type: String },
      resolvedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
BookingSchema.index({ customerId: 1, status: 1 });
BookingSchema.index({ providerId: 1, status: 1 });
BookingSchema.index({ scheduledDate: 1, status: 1 });
BookingSchema.index({ "timeline.bookedAt": 1 });
BookingSchema.index({ "dispute.status": 1 });

// Pre-save middleware to set timeline.bookedAt on creation
BookingSchema.pre(
  "save",
  function (
    this: mongoose.Document & Partial<IBooking>,
    next: (err?: any) => void
  ) {
    if (this.isNew) {
      if (!this.timeline) {
        (this as any).timeline = {};
      }
      (this as any).timeline.bookedAt = new Date();
    }
    next();
  }
);

// Method to calculate final amount
BookingSchema.methods.calculateFinalAmount = function () {
  const actualHours = this.pricing.actualHours || this.pricing.estimatedHours;
  const serviceFee = this.pricing.hourlyRate * actualHours;
  this.pricing.finalAmount = serviceFee + this.pricing.platformFee;
  return this.pricing.finalAmount;
};

// Method to validate status transition
BookingSchema.methods.canTransitionTo = function (newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["on-the-way", "cancelled"],
    "on-the-way": ["arrived", "cancelled"],
    arrived: ["in-progress", "cancelled"],
    "in-progress": ["awaiting-customer-approval"],
    "awaiting-customer-approval": ["completed", "disputed"],
    disputed: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  return validTransitions[this.status]?.includes(newStatus) || false;
};

export default mongoose.model<IBooking>("Booking", BookingSchema);
