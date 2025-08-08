import { connectDB } from "@/src/lib/mongoose";
import { Book } from "@/src/models/book.model";
import { Room, RoomStatus } from "@/src/models/room.model";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { roomId } = await params;
    const body = await req.json();
    const { status } = body;

    // 1. Update Room Status to "Available"
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

    // 2. Find and Update Guest Status to "Checked Out"
    const guest = await Book.findByIdAndUpdate(
      updatedRoom?.guestId,
      {
        $set: {
          "guest.status": status,
          "guest.checkedOutAt": new Date(),
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: {
        room: updatedRoom,
        guest: guest || { message: "No active guest found for this room" },
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
      },
      { status: 500 }
    );
  }
}
