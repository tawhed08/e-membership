import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  membership: mongoose.Types.ObjectId;
  type: "expiry_warning";
  daysBefore: 30 | 7 | 1;
  title: string;
  message: string;
  readAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    membership: {
      type: Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
    },
    type: {
      type: String,
      enum: ["expiry_warning"],
      required: true,
    },
    daysBefore: {
      type: Number,
      enum: [30, 7, 1],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    readAt: Date,
    sentAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index(
  { membership: 1, daysBefore: 1 },
  { unique: true, name: "unique_membership_expiry_reminder" }
);
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;