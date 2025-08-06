import { Schema, model, models, Types } from "mongoose";

export enum RoomType {
  SINGLE = "Single",
  TWIN = "Twin",
  QUEEN = "Queen",
  SUITE = "Suite",
}

export enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  RESERVED = "RESERVED",
  OCCUPIED = "OCCUPIED",
}

export interface IRoom {
  _id?: Types.ObjectId;
  roomNo: string;
  roomType: RoomType;
  roomFloor: string;
  // isBooked: boolean;
  roomStatus: RoomStatus;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomNo: { type: String, required: true },
    roomType: { type: String, enum: Object.values(RoomType), required: true },
    roomFloor: { type: String, required: true },
    // isBooked: { type: Boolean, default: false },
    roomStatus: {
      type: String,
      enum: Object.values(RoomStatus),
      default: RoomStatus.AVAILABLE,
    },
  },
  { timestamps: true, versionKey: false }
);

export const Room = models?.Room || model<IRoom>("Room", RoomSchema);
