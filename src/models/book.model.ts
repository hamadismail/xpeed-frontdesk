import { model, models, Schema, Types } from "mongoose";

export enum OTAS {
  DEFAULT = "N/A",
  BOOKING_COM = "Booking.com",
  WALKING_GUEST = "Walking Guest",
  AGODA = "Agoda",
  TRAVELOKA = "Traveloka",
  EXPEDIA = "Expedia",
  TICKET = "Ticket",
  TRIP_COM = "Trip.com",
}

export enum GUEST_STATUS {
  CHECKED_IN = "CheckedIn",
  CHECKED_OUT = "CheckedOut",
  RESERVED = "Reserved",
  CANCEL = "Cancel",
}

export enum PAYMENT_METHOD {
  CASH = "Cash",
  CREDIT_CARD = "Credit/Debit Card",
  OR = "QR/Bank Transfer",
  CITY_LEDGER = "City Ledger",
}

export interface IBook {
  _id?: string;
  guest: {
    name: string;
    email: string;
    phone: string;
    country: string;
    passport: string;
    refId: string;
    otas: OTAS;
    status: GUEST_STATUS;
  };
  stay: {
    arrival: Date;
    departure: Date;
    adults: number;
    children: number;
  };
  payment: {
    roomPrice: number;
    subtotal: number;
    sst?: number;
    tourismTax?: number;
    discount?: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: PAYMENT_METHOD;
    remarks: string;
  };
  roomId?: Types.ObjectId | { roomNo: string };
}

const bookSchema = new Schema<IBook>(
  {
    guest: {
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String, required: true },
      country: { type: String },
      passport: { type: String },
      refId: { type: String, required: true },
      otas: { type: String, enum: Object.values(OTAS) },
      status: { type: String, enum: Object.values(GUEST_STATUS) },
    },
    stay: {
      arrival: { type: Date, required: true },
      departure: {
        type: Date,
        required: true,
      },
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    payment: {
      roomPrice: { type: Number, required: true },
      subtotal: { type: Number },
      sst: { type: Number, default: 0 },
      tourismTax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      paidAmount: { type: Number, required: true },
      dueAmount: { type: Number },
      paymentMethod: {
        type: String,
        enum: Object.values(PAYMENT_METHOD),
      },
      remarks: { type: String, required: true },
    },
    roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Book = models?.Book || model<IBook>("Book", bookSchema);
