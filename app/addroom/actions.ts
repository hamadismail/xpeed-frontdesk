"use server";

import { connectDB } from "@/lib/mongoose";
import { Room } from "@/models/room.model";

type RoomType = "Single" | "Twin" | "Queen" | "Suite";

interface RoomData {
  roomNo: string;
  roomType: RoomType;
  roomFloor: string;
}

export async function createRoom(payload: RoomData): Promise<{
  success: boolean;
  data?: typeof Room;
  error?: string;
}> {
  try {
    // Validate required fields
    if (!payload.roomNo || !payload.roomType || !payload.roomFloor) {
      throw new Error("All room fields are required");
    }

    await connectDB();

    // Check if room already exists
    const existingRoom = await Room.findOne({ roomNo: payload.roomNo });
    if (existingRoom) {
      throw new Error(`Room ${payload.roomNo} already exists`);
    }

    const newRoom = await Room.create(payload);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newRoom)), // ✅ plain object
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create room",
    };
  }
}
