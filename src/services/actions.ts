"use server";

import { connectDB } from "@/src/lib/mongoose";
import { Room, RoomType } from "@/src/models/room.model";

interface RoomData {
  roomNo: string;
  roomType: RoomType;
  roomFloor: string;
}

interface IPromise {
  success: boolean;
  data?: typeof Room;
  error?: string;
}

export async function createRoom(payload: RoomData): Promise<IPromise> {
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
      data: JSON.parse(JSON.stringify(newRoom)),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create room",
    };
  }
}
