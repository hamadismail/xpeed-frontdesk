import { Schema, model, models, Types } from "mongoose";

export enum RoomType {
  SQUEEN = "Standard Queen Room",
  DTWIN = "Delux Twin Room",
  DQUEEN = "Delux Queen Room",
  DTRIPPLE = "Deluxe Triple Room",
  SFAMILLY = "Superior Family Room",
  DFAMILLY = "Deluxe Family Room",
}

export enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  RESERVED = "RESERVED",
  OCCUPIED = "OCCUPIED",
}

export interface IRoom {
  _id?: Types.ObjectId;
  guestId?: Types.ObjectId;
  roomNo: string;
  roomType: RoomType;
  roomFloor: string;
  // isBooked: boolean;
  roomStatus: RoomStatus;
}

const RoomSchema = new Schema<IRoom>(
  {
    guestId: { type: Schema.Types.ObjectId, ref: "Book", default: null },
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
