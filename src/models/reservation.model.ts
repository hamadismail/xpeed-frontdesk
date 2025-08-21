import { model, models, Schema } from "mongoose";
import { IReservation } from "../types";

const reservationSchema = new Schema<IReservation>(
  {
    guest: {
      reservationNo: { type: String },
      ota: { type: String },
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String, required: true },
      nationality: { type: String },
      passport: { type: String },
    },
    room: {
      roomNo: { type: String },
      numOfGuest: { type: String },
      arrival: { type: Date, required: true },
      departure: { type: Date, required: true },
      roomDetails: { type: String },
      otherGuest: { type: String },
    },
    payment: {
      bookingFee: { type: Number, default: 0 },
      sst: { type: Number, default: 0 },
      tourismTax: { type: Number, default: 0 },
      fnfDiscount: { type: Number, default: 0 },
      totalAmount: { type: Number },
    },
    reservationDate: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Reservation =
  models?.Reservation || model<IReservation>("Reservation", reservationSchema);
