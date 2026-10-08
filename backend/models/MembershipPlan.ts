import mongoose, { Document, Schema } from "mongoose";

export interface IMembershipPlan extends Document {
  name: string;
  description: string;
  price: number;
  durationDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const membershipPlanSchema =
  new Schema<IMembershipPlan>(
    {
      name: {
        type: String,
        required: [true, "Plan name is required"],
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      description: {
        type: String,
        required: [true, "Plan description is required"],
        trim: true,
        maxlength: 500,
      },

      price: {
        type: Number,
        required: [true, "Plan price is required"],
        min: 0,
      },

      durationDays: {
        type: Number,
        required: [true, "Plan duration is required"],
        min: 1,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

const MembershipPlan =
  mongoose.model<IMembershipPlan>(
    "MembershipPlan",
    membershipPlanSchema
  );

export default MembershipPlan;