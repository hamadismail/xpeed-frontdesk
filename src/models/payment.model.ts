import { model, models, Schema, Types } from "mongoose";
import { PAYMENT_METHOD } from "./book.model";

export interface IPayment {
  _id?: string;
  guestId: Types.ObjectId;
  paymentDate: Date;
  paymentMethod: PAYMENT_METHOD;
  paidAmount: number;
}

const paymentSchema = new Schema<IPayment>(
  {
    guestId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    paymentDate: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    paidAmount: { type: Number, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Payment =
  models?.Payment || model<IPayment>("Payment", paymentSchema);