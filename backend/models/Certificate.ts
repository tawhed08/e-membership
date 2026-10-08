import mongoose, { Document, Schema } from "mongoose";

export interface ICertificate extends Document {
  certificateId: string;

  user: mongoose.Types.ObjectId;
  membership: mongoose.Types.ObjectId;

  issueDate: Date;
  expiryDate: Date;

  status: "active" | "expired" | "revoked";

  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateId: {
      type: String,
      required: [true, "Certificate ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

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

    issueDate: {
      type: Date,
      required: [true, "Issue date is required"],
    },

    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },

    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ user: 1 });
certificateSchema.index({ membership: 1 });
certificateSchema.index({ expiryDate: 1 });
certificateSchema.index({ status: 1 });

const Certificate = mongoose.model<ICertificate>(
  "Certificate",
  certificateSchema
);

export default Certificate;