import { connectDB } from "@/src/lib/mongoose";
import { Room, RoomStatus } from "@/src/models/room.model";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { roomId } = await params;

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { roomStatus: RoomStatus.AVAILABLE },
      { new: true }
    );

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRoom,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
