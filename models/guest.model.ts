import { model, models, Schema, Types } from "mongoose";

export interface IGuest extends Document {
  // _id: Types.ObjectId;
  name: string;
  phone: string;
  room: Types.ObjectId;
  checkInDate: Date;
}

const guestSchema = new Schema<IGuest>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    checkInDate: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

export const Guest = models.Guest || model<IGuest>("Guest", guestSchema);
