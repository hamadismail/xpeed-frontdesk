import { model, models, Schema } from "mongoose";
import { IReservation } from "../types";

const reservationSchema = new Schema<IReservation>(
  {
    guest: {
      reservationNo: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
      nationality: { type: String },
      passport: { type: String },
    },
    room: {
      roomNo: { type: String },
      numOfGuest: { type: String },
      arrival: { type: Date },
      departure: { type: Date },
      roomDetails: { type: String },
      otherGuest: { type: String },
    },
    payment: {
      bookingFee: { type: Number },
      sst: { type: Number },
      tourismTax: { type: Number },
      fnfDiscount: { type: Number },
      pricingPolicy: { type: String },
      netPriceInWord: { type: String },
      paymentStatus: { type: String },
    },
    reservationDate: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Reservation =
  models?.Reservation || model<IReservation>("Reservation", reservationSchema);
