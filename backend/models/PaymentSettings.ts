import { Model, Schema, model, models } from "mongoose";

export interface ManualPaymentMethodSettings {
  enabled: boolean;
  accountName: string;
  accountNumber: string;
  instructions: string;
}

export interface BankPaymentSettings extends ManualPaymentMethodSettings {
  bankName: string;
  branch: string;
}

export interface IPaymentSettings {
  _id: string;
  bkash: ManualPaymentMethodSettings;
  nagad: ManualPaymentMethodSettings;
  bank: BankPaymentSettings;
  cardEnabled: boolean;
  updatedAt?: Date;
}

const manualMethodSchema = new Schema<ManualPaymentMethodSettings>(
  {
    enabled: { type: Boolean, default: true },
    accountName: { type: String, trim: true, maxlength: 120, default: "" },
    accountNumber: { type: String, trim: true, maxlength: 120, default: "" },
    instructions: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { _id: false }
);

const paymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    _id: { type: String, default: "payment-methods" },
    bkash: { type: manualMethodSchema, default: () => ({}) },
    nagad: { type: manualMethodSchema, default: () => ({}) },
    bank: {
      type: new Schema<BankPaymentSettings>(
        {
          enabled: { type: Boolean, default: true },
          accountName: { type: String, trim: true, maxlength: 120, default: "" },
          accountNumber: { type: String, trim: true, maxlength: 120, default: "" },
          instructions: { type: String, trim: true, maxlength: 1000, default: "" },
          bankName: { type: String, trim: true, maxlength: 120, default: "" },
          branch: { type: String, trim: true, maxlength: 120, default: "" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    cardEnabled: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

const PaymentSettings =
  (models.PaymentSettings as Model<IPaymentSettings> | undefined) ??
  model<IPaymentSettings>("PaymentSettings", paymentSettingsSchema);

export default PaymentSettings;
