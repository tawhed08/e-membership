import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  membership: mongoose.Types.ObjectId;

  amount: number;

  method: "bkash" | "nagad" | "bank" | "card";

  transactionId: string;

  status: "pending" | "approved" | "rejected" | "refunded";

  note?: string;
  gatewayTransactionId?: string;

  paidAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    membership: {
      type: Schema.Types.ObjectId,
      ref: "Membership",
      required: [true, "Membership is required"],
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: 0,
    },

    method: {
      type: String,
      enum: ["bkash", "nagad", "bank", "card"],
      required: [true, "Payment method is required"],
    },

    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      trim: true,
      unique: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "refunded",
      ],
      default: "pending",
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    gatewayTransactionId: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  user: 1,
});

paymentSchema.index({
  membership: 1,
});

paymentSchema.index({
  status: 1,
});

const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);

export default Payment;