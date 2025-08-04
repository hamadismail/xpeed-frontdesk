import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  // _id: Types.ObjectId;
  roomNo: string;
  roomType: string;
  roomFloor: string;
  isBooked: boolean;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomNo: { type: String, required: true },
    roomType: { type: String, required: true },
    roomFloor: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export const Room =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
