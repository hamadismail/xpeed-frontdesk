// lib/db.ts
import { connectDB } from "./mongoose";
import { Room } from "@/models/room.model";

export async function getRooms() {
  await connectDB();
  const rooms = await Room.find().lean();
  return rooms;
}
