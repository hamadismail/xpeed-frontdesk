// lib/db.ts
import { connectDB } from "./mongoose";
import { Room } from "@/src/models/room.model";

export async function getRooms() {
  await connectDB();
  const rooms = await Room.find().sort({roomNo: 1}).lean();
  return rooms;
}
