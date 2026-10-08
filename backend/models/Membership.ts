import mongoose, { Document, Schema } from "mongoose";

export interface IMembership extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;

  startDate?: Date;
  expiryDate?: Date;

  status: "pending" | "active" | "expired" | "cancelled";

  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  pendingPaymentId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    plan: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: [true, "Membership plan is required"],
    },

    startDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "expired",
        "cancelled",
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    pendingPaymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index({
  user: 1,
});

membershipSchema.index({
  plan: 1,
});

membershipSchema.index({
  expiryDate: 1,
});

membershipSchema.index({
  status: 1,
});

const Membership = mongoose.model<IMembership>(
  "Membership",
  membershipSchema
);

export default Membership;