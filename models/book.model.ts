import { model, models, Schema, Types } from "mongoose";

export enum OTAS {
  BOOKING_COM = "booking_com",
  WALKING_GUEST = "walking_guest",
  AGODA = "agoda",
  TRAVELOKA = "traveloka",
  EXPEDIA = "expedia",
  TICKET = "ticket",
  TRIP_COM = "trip_com",
}

export interface IBook {
  guest: {
    name: string;
    email: string;
    phone: string;
    country: string;
    passport: string;
    refId: string;
    otas: OTAS;
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
    paymentMethod: string;
  };
  roomId?: Types.ObjectId;
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
      otas: {type: String, enum: Object.values(OTAS)}
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
        enum: ["cash", "credit_card", "bank_transfer"],
      },
    },
    roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Book = models?.Book || model<IBook>("Book", bookSchema);
