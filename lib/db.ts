// lib/db.ts
import { connectDB } from "./mongoose";
import { Room } from "@/app/models/Room";

export async function getRooms() {
  await connectDB();
  const rooms = await Room.find().lean();
  return rooms;
}
